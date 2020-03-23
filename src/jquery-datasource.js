import $ from 'jquery';
const deparam = require("deparam");
const debounce = require('lodash.debounce');

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'datasource';
const JQUERY_NO_CONFLICT = $.fn[NAME];

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
 * Class Definition
 * ------------------------------------------------------------------------
 */

class Datasource {
  constructor(element, options) {
    this.element = element;

    this._options = $.extend({}, $.fn[NAME].defaults, options);

    this._parameters = {
      'perPage': 10,
      'filter': {},
      'sort': {},
    };

    this.applyFilter = debounce(this.applyFilter, this._options.debounce);

    this._init();
  }

  // Public

  refresh() {
    $(this.element).trigger(Event.REFRESHING);
    $.ajax(this._getAjaxOptions()).then((response) => {
        this._handleSuccessfullRefresh(response);
      })
      .always(() => {
        this._handleRefreshCompleted();
      });
  }

  changeLength(length) {
    this._parameters.perPage = length;
    this._updateState();
  }

  goToPage(page) {
    this._parameters.page = page;
    this._updateState();
  }

  applyFilter(name, value) {
    this._parameters.filter[name] = value;
    this._updateState();
  }

  removeFilter(name) {
    delete this._parameters.filter[name];
    this._updateState();
  }

  applySort(name, direction = 'asc') {
    this._parameters.sort[name] = direction;
    this._updateState();
  }

  // Private

  _updateState() {
    history.pushState(this._parameters, '', "?" + $.param(this._parameters));
    this.refresh();
  }

  _getAjaxOptions() {
    return $.extend({}, {
      url: this._options.url,
      data: this._parameters
    }, this._options.ajax);
  }

  _handleSuccessfullRefresh(response) {
    $(this.element).find(Selector.CONTAINER).html(response.data);
  }

  _handleRefreshCompleted() {
    $(this.element).trigger(Event.REFRESHED);
  }

  _handleLengthChange(element) {
    this.changeLength($(element).val());
  }

  _handlePageChange(element) {
    let page = $(element).data('page');
    if (!page) {
      throw new Error('Missing data-page attribute');
    }

    this.goToPage(page);
  }

  _handleFiltering(element) {
    let filter = $(element).data('filter');
    if (!filter) {
      throw new Error('Missing data-filter attribute');
    }

    this.applyFilter(filter, $(element).val(), $(element).data('debounce') || 0);
  }

  _handleSorting(element) {
    let sort = $(element).data('sort');
    if (!sort) {
      throw new Error('Missing data-sort attribute');
    }

    this.applySort(sort, $(element).data('direction'));
  }

  _parseQueryParameters() {
    const parsed = deparam(window.location.search.split('?')[1] || '');
    this._parameters = $.extend({}, this._parameters, parsed);
  }

  _init() {
    let _this = this;

    $(this.element)
      .on('change', Selector.LENGTH, function (event) {
        event.preventDefault();
        _this._handleLengthChange(this);
      })
      .on('click', Selector.PAGINATION, function (event) {
        event.preventDefault();
        _this._handlePageChange(this);
      })
      .on('change input', Selector.FILTER, function (event) {
        _this._handleFiltering(this);
      })
      .on('click', Selector.SORT, function (event) {
        _this._handleSorting(this);
      });

      this._parseQueryParameters();

      window.onpopstate = function(event) {
        _this._parameters = event.state;
        _this.refresh();
      };
  }

  // Static

  static _jQueryInterface(options = {}) {
    return this.each(function () {
      const $element = $(this);
      let data = $element.data(NAME);

      if (!data) {
        data = new Datasource(this, options);
        $element.data(NAME, data);
      }
    })
  }
}

/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 */

$.fn[NAME] = Datasource._jQueryInterface;
$.fn[NAME].Constructor = Datasource;
$.fn[NAME].defaults = {
  url: '',
  ajax: {},
  debounce: 300,
};
$.fn[NAME].noConflict = () => {
  $.fn[NAME] = JQUERY_NO_CONFLICT;
  return Datasource._jQueryInterface;
}

export default Datasource;