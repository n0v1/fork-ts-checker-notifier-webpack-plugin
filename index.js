var path = require('path');
var notifier = require('node-notifier');
var util = require('util');

var messageTemplates = {
    buildSucceeded: {
        title: '%sBuild succeeded',
        message: 'The build has succeeded.',
        icon: path.join(__dirname, 'images/built.png')
    },
    warning: {
        title: '%s%s',
        message: '',
        icon: path.join(__dirname, 'images/warning.png')
    },
    error: {
        title: '%s%s',
        message: '',
        icon: path.join(__dirname, 'images/error.png')
    }
};

var ForkTsCheckerNotifierWebpackPlugin = module.exports = function (options) {
    this.options = options || {};
    this.lastBuildSucceeded = false;
    this.isFirstBuild = true;
    this.titlePrefix = this.options.title ? this.options.title + ' - ' : '';
};

ForkTsCheckerNotifierWebpackPlugin.prototype.buildNotification = function (diagnostics, lints) {
    if (this.isFirstBuild) {
        this.isFirstBuild = false;

        if (this.options.skipFirstNotification) {
            return undefined;
        }
    }

    var notification;
    if (diagnostics.length) {
        this.lastBuildSucceeded = false;

        var firstError = diagnostics.find(function (diagnostic) { return diagnostic.isErrorSeverity() });
        if (firstError) {
            notification = Object.assign({}, messageTemplates.error, {
                title: util.format(messageTemplates.error.title, this.titlePrefix, 'Error: ' + firstError.getFile()),
                message: firstError.getContent()
            });
        } else if (!this.options.excludeWarnings) {
            var warning = diagnostics[0];
            notification = Object.assign({}, messageTemplates.warning, {
                title: util.format(messageTemplates.warning.title, this.titlePrefix, 'Warning: ' + warning.getFile()),
                message: warning.getContent()
            });
        }
    } else if (!this.lastBuildSucceeded || this.options.alwaysNotify) {
        this.lastBuildSucceeded = true;
        notification = Object.assign({}, messageTemplates.buildSucceeded, {
            title: util.format(messageTemplates.buildSucceeded.title, this.titlePrefix)
        });
    }

    return notification;
};

ForkTsCheckerNotifierWebpackPlugin.prototype.compilationDone = function (diagnostics, lints) {
    var notification = this.buildNotification(diagnostics, lints);
    if (notification) {
        notifier.notify(notification);
    }
};

ForkTsCheckerNotifierWebpackPlugin.prototype.apply = function (compiler) {
    compiler.plugin('fork-ts-checker-receive', this.compilationDone.bind(this));
};
