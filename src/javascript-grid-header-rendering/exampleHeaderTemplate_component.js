var columnDefs = [
    {headerName: "Athlete", field: "athlete", width: 150, suppressMenu: true},
    {headerName: "Age", field: "age", width: 90, suppressSorting: true, headerComponentParams : { menuIcon: 'fa-external-link'}},
    {headerName: "Country", field: "country", width: 120, suppressMenu: true},
    {headerName: "Year", field: "year", width: 90, suppressSorting: true},
    {headerName: "Date", field: "date", width: 110, suppressMenu: true},
    {headerName: "Sport", field: "sport", width: 110, suppressSorting: true},
    {headerName: "Gold", field: "gold", width: 100, headerComponentParams : { menuIcon: 'fa-cog'}},
    {headerName: "Silver", field: "silver", width: 100, suppressSorting: true},
    {headerName: "Bronze", field: "bronze", width: 100, suppressMenu: true},
    {headerName: "Total", field: "total", width: 100, suppressSorting: true}
];

var gridOptions = {
    columnDefs: columnDefs,
    rowData: null,
    enableFilter: true,
    enableSorting: true,
    enableColResize: true,
    suppressMenuHide: true,
    defaultColDef : {
        headerComponent : MyHeaderComponent,
        headerComponentParams : {
            menuIcon: 'fa-bars'
        }
    }
};

function MyHeaderComponent(params) {
    this.params = params;
}

MyHeaderComponent.prototype.init = function (agParams){
    this.agParams = agParams;
    this.eGui = document.createElement('div');
    this.eGui.innerHTML = ''+
        '<div class="customHeaderMenuButton"><i class="fa ' + this.params.menuIcon + '"></i></div>' +
        '<div class="customHeaderLabel">' + this.agParams.displayName + '</div>' +
        '<div class="customSortDownLabel inactive"><i class="fa fa-long-arrow-down"></i></div>' +
        '<div class="customSortUpLabel inactive"><i class="fa fa-long-arrow-up"></i></div>' +
        '<div class="customSortRemoveLabel inactive"><i class="fa fa-times"></i></div>';

    this.eMenuButton = this.eGui.querySelector(".customHeaderMenuButton");
    this.eSortDownButton = this.eGui.querySelector(".customSortDownLabel");
    this.eSortUpButton = this.eGui.querySelector(".customSortUpLabel");
    this.eSortRemoveButton = this.eGui.querySelector(".customSortRemoveLabel");


    if (this.agParams.enableMenu){
        this.onMenuClickListener = this.onMenuClick.bind(this);
        this.eMenuButton.addEventListener('click', this.onMenuClickListener);
    }else{
        this.eGui.removeChild(this.eMenuButton);
    }

    if (this.agParams.enableSorting){
        this.onSortRequestedListener = this.onSortRequested.bind(this);
        this.eSortDownButton.addEventListener('click', this.onSortRequestedListener);
        this.eSortUpButton.addEventListener('click', this.onSortRequestedListener);
        this.eSortRemoveButton.addEventListener('click', this.onSortRequestedListener);


        this.onSortChangedListener = this.onSortChanged.bind(this);
        this.agParams.column.addEventListener('sortChanged', this.onSortChangedListener);
        this.onSortChanged();
    } else {
        this.eGui.removeChild(this.eSortDownButton);
        this.eGui.removeChild(this.eSortUpButton);
        this.eGui.removeChild(this.eSortRemoveButton);
    }
};

MyHeaderComponent.prototype.onSortChanged = function (){
    function deactivate (toDeactivateItems){
        toDeactivateItems.forEach(function (toDeactivate){toDeactivate.className = toDeactivate.className.split(' ')[0]});
    }

    function activate (toActivate){
        toActivate.className = toActivate.className + " active";
    }

    if (this.agParams.column.isSortAscending()){
        deactivate([this.eSortUpButton, this.eSortRemoveButton]);
        activate (this.eSortDownButton)
    } else if (this.agParams.column.isSortDescending()){
        deactivate([this.eSortDownButton, this.eSortRemoveButton]);
        activate (this.eSortUpButton)
    } else {
        deactivate([this.eSortUpButton, this.eSortDownButton]);
        activate (this.eSortRemoveButton)
    }
};

MyHeaderComponent.prototype.getGui = function (){
    return this.eGui;
};

MyHeaderComponent.prototype.onMenuClick = function () {
    this.agParams.showColumnMenu (this.eMenuButton);
};

MyHeaderComponent.prototype.onSortRequested = function (event) {
    this.agParams.progressSort (event.shiftKey);
};

MyHeaderComponent.prototype.destroy = function () {
    if (this.onMenuClickListener){
        this.eMenuButton.removeEventListener('click', this.onMenuClickListener)
    }
    this.eSortDownButton.removeEventListener('click', this.onSortRequestedListener);
    this.eSortUpButton.removeEventListener('click', this.onSortRequestedListener);
    this.eSortRemoveButton.removeEventListener('click', this.onSortRequestedListener);
    this.agParams.column.removeEventListener('sortChanged', this.onSortChangedListener);
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function() {
    var gridDiv = document.querySelector('#myGrid');
    new agGrid.Grid(gridDiv, gridOptions);

    // do http request to get our sample data - not using any framework to keep the example self contained.
    // you will probably use a framework like JQuery, Angular or something else to do your HTTP calls.
    var httpRequest = new XMLHttpRequest();
    httpRequest.open('GET', '../olympicWinners.json');
    httpRequest.send();
    httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState == 4 && httpRequest.status == 200) {
            var httpResult = JSON.parse(httpRequest.responseText);
            gridOptions.api.setRowData(httpResult);
        }
    };
});