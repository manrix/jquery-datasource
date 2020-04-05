import $ from 'jquery';
const deparam = require("deparam");
const debounce = require('lodash.debounce');

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'datasource';

const Selector = {
  CONTAINER: '.datasource-container',
  LENGTH: '.datasource-length',
  PAGINATION: '.datasource-pagination-item',
  FILTER: '.datasource-filter',
  SORT: '.datasource-sort',
};

const Event = {
  REFRESHING: 'refreshing',
  REFRESHED: 'refreshed',
};

/**
 * ------------------------------------------------------------------------
 * Plugin Definition
 * ------------------------------------------------------------------------
 */

$.fn[NAME] = function(options) {

  let _this = this;

  let _options = $.extend({}, $.fn[NAME].defaults, options);

  let _parameters = $.extend({}, {
    'perPage': 10,
    'filter': {},
    'sort': {},
  }, $.fn[NAME].defaults.parameters);

  // Private

  let _updateState = () => {
    history.pushState(_parameters, '', "?" + $.param(_parameters));
    this.refresh();
  }

  let _getAjaxOptions = () => {
    return $.extend({}, {
      url: _options.url,
      data: _parameters
    }, _options.ajax);
  }

  let _handleSuccessfullRefresh = (response) => {
    this.find(Selector.CONTAINER).html(response.data);
  }

  let _handleRefreshCompleted = () => {
    this.trigger(Event.REFRESHED);
  }

  let _handleLengthChange = (element) => {
    this.changeLength($(element).val());
  }

  let _handlePageChange = (element) => {
    let page = $(element).data('page');
    if (!page) {
      throw new Error('Missing data-page attribute');
    }

    this.goToPage(page);
  }

  let _handleFiltering = (element) => {
    let filter = $(element).data('filter');
    if (!filter) {
      throw new Error('Missing data-filter attribute');
    }

    this.applyFilter(filter, $(element).val());
  }

  let _handleSorting = (element) => {
    let sort = $(element).data('sort');
    if (!sort) {
      throw new Error('Missing data-sort attribute');
    }

    this.applySort(sort, $(element).data('direction'));
  }

  let _parseQueryParameters = () => {
    const parsed = deparam(window.location.search.split('?')[1] || '');
    this._parameters = $.extend({}, this._parameters, parsed);
  }

  let _init = () => {
    this
      .on('change', Selector.LENGTH, function (event) {
        event.preventDefault();
        _handleLengthChange(this);
      })
      .on('click', Selector.PAGINATION, function (event) {
        event.preventDefault();
        _handlePageChange(this);
      })
      .on('change input', Selector.FILTER, function (event) {
        _handleFiltering(this);
      })
      .on('click', Selector.SORT, function (event) {
        _handleSorting(this);
      });

      _parseQueryParameters();

      window.onpopstate = function(event) {
        _parameters = event.state;
        _this.refresh();
      };

    return this;
  }

  // Public

  this.refresh = () => {
    this.trigger(Event.REFRESHING);
    $.ajax(_getAjaxOptions()).then((response) => {
        _handleSuccessfullRefresh(response);
      })
      .always(() => {
        _handleRefreshCompleted();
      });

    return this;
  }

  this.changeLength = (length) => {
    _parameters.perPage = length;
    _updateState();

    return this;
  }

  this.goToPage = (page) => {
    _parameters.page = page;
    _updateState();

    return this;
  }

  this.applyFilter = debounce(function(name, value) {
    _parameters.filter[name] = value;
    _updateState();

    return _this;
  }, _options.debounce);

  this.removeFilter = (name) => {
    delete _parameters.filter[name];
    _updateState();

    return this;
  }

  this.applySort = (name, direction = 'asc') => {
    _parameters.sort[name] = direction;
    _updateState();

    return this;
  }

  this.setParameter = (name, value) => {
    _parameters[name] = value;
    _updateState();

    return this;
  }

  this.removeParameter = (name) => {
    delete _parameters[name];
    _updateState();

    return this;
  }

  return _init();
}

$.fn[NAME].defaults = {
  url: '',
  ajax: {},
  parameters: {},
  debounce: 300,
};