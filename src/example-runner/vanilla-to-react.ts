import parser, { recognizedDomEvents } from './vanilla-src-parser';
import styleConvertor from './lib/convert-style-to-react';

function indexTemplate(bindings) {
    const imports = [];
    const propertyAssignments = bindings.properties.map(property => `${property.name}: ${property.value}`);
    const componentAttributes = bindings.properties.map(property => `${property.name}={this.state.${property.name}}`);
    const componentEventAttributes = bindings.eventHandlers.map(event => `${event.handlerName}={this.${event.handlerName}.bind(this)}`);

    componentAttributes.push('onGridReady={this.onGridReady.bind(this)}');
    componentAttributes.push.apply(componentAttributes, componentEventAttributes);

    const additional = [];

    if (bindings.gridSettings.enterprise) {
        imports.push('import "ag-grid-enterprise";');
    }

    const additionalInReady = [];

    if (bindings.data) {
        additionalInReady.push(`
        const httpRequest = new XMLHttpRequest();
        const updateData = (data) => ${bindings.data.callback};

        httpRequest.open('GET', ${bindings.data.url});
        httpRequest.send();
        httpRequest.onreadystatechange = () => {
            if (httpRequest.readyState === 4 && httpRequest.status === 200) {
                updateData(JSON.parse(httpRequest.responseText));
            }
        };`);
    }

    if (bindings.onGridReady) {
        const hackedHandler = bindings.onGridReady.replace(/^\{|\}$/g, '');
        additionalInReady.push(hackedHandler);
    }

    if (bindings.resizeToFit) {
        additionalInReady.push('this.agGrid.api.sizeColumnsToFit();');
    }

    const agGridTag = `<div style={{
                boxSizing: 'border-box', 
                height: '${bindings.gridSettings.height}', 
                width: '${bindings.gridSettings.width}'}} 
                className="${bindings.gridSettings.theme}">

            <AgGridReact
                id="myGrid"
                ${componentAttributes.join('\n        ')}
            />

            </div>`;

    let template = bindings.template ? bindings.template.replace('$$GRID$$', agGridTag) : agGridTag;


    recognizedDomEvents.forEach( event => {
        const jsEvent = 'on' + event[0].toUpperCase() + event.substr(1, event.length);
        const matcher = new RegExp(`on${event}="(\\w+)\\((.*)\\)"`, 'g');
        template = template.replace(matcher, `${jsEvent}={this.$1.bind(this, $2)}`);
    });
    template = template.replace(/\(this\, \)/g, '(this)');

    template = template.replace(/<input type="radio" (.+?)>/g, '<input type="radio" $1 />');
    template = template.replace(/<input type="checkbox" (.+?)>/g, '<input type="checkbox" $1 />');
    template = template.replace(/<input type="text" (.+?)>/g, '<input type="text" $1 />');
    template = template.replace(/<input placeholder(.+?)>/g, '<input placeholder$1 />');

    template = styleConvertor(template);

    const eventHandlers = bindings.eventHandlers.map(event => event.handler.replace(/^function /, ''));
    const externalEventHandlers = bindings.externalEventHandlers.map(handler => handler.body.replace(/^function /, ''));

    return `
'use strict'

import React, {Component} from "react"
import {render} from "react-dom"
import {AgGridReact} from 'ag-grid-react';
${imports.join('\n')}

${bindings.utils.join('\n')}

class GridExample extends Component {
    constructor(props) {
        super(props);

        this.state = {
            ${propertyAssignments.join(',\n    ')}
        };
    }

    onGridReady(params) {
        this.agGrid = params;
        const gridOptions = params;

        ${additionalInReady.join('\n')}
    }

${additional.concat(eventHandlers, externalEventHandlers).join('\n    ')}

    render() {
        return (
            <div style={{width: '100%', height: '100%' }}>
                ${template}
            </div>
        );
    }
}

render(
    <GridExample></GridExample>,
    document.querySelector('#root')
)
`;
}

export function vanillaToReact(src, gridSettings) {
    const bindings = parser(src, gridSettings, {
        gridOptionsLocalVar: 'const gridOptions = this.agGrid'
    });
    return indexTemplate(bindings);
}

if (typeof window !== 'undefined') {
    (<any>window).vanillaToReact = vanillaToReact;
}