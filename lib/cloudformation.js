var AWS = require('aws-sdk'),
	async = require('async');

module.exports = function(config) {
	AWS.config.update(config);

	var cloudFormation = new AWS.CloudFormation({apiVersion: '2010-05-15'});

	cloudFormation.defineStack = function(params, done) {

		function findStack(callback) {
			cloudFormation.describeStacks({ StackName: params.StackName }, function(err, stack) {
				if (err && err.message.match('Stack with id .* does not exist')) {
					err = null;
				}

				callback(err, stack);
			});
		}

		function upsert(callback) {
			async.waterfall([
				findStack,
				function(stack, next) {
					if (stack) {
						console.log('Updating CloudFormation stack', params.StackName);
						cloudFormation.updateStack(params, next);
					} else {
						console.log('Creating CloudFormation stack', params.StackName);
						cloudFormation.createStack(params, next);
					}
				},
			], function(err) {
				if (err && err.message.match('No updates are to be performed')) {
					err = null;
				}
				callback(err);
			});
		}

		function waitForStackToComplete(callback) {
			console.log('Waiting for Stack operation to complete');

			async.forever(function(checkAgain) {
				async.waterfall([
					findStack,
					function(result, next) {
						if (result && result.Stacks && result.Stacks.length > 0) {
							next(null, result.Stacks[0]);
							return;
						}

						next(new Error('Could not find stack'));
					},
					function(stack, next) {
						if (stack.StackStatus === 'CREATE_COMPLETE' || stack.StackStatus === 'UPDATE_COMPLETE') {
							next(null, stack);
							return;
						}

						if (stack.StackStatus === 'CREATE_IN_PROGRESS' || stack.StackStatus === 'UPDATE_IN_PROGRESS') {
							setTimeout(checkAgain, 10000);
							return;
						}

						next(new Error('Stack went in to an unexpected state: ' + stack.StackStatus));
					}
				], callback);
			});
		}

		async.waterfall([
			upsert,
			waitForStackToComplete
		], done);
	};

	return cloudFormation;
};
