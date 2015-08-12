var _ = require('lodash'),
	async = require('async'),
	rfile = require('rfile'),
	jsonfile = require('jsonfile'),
	CloudFormation = require('../lib/cloudformation');

module.exports = function(args) {
	var name = args.name;
	var env = args.environment;
	var bucket = args.bucket;

	var cloudFormation = CloudFormation({ region: args.region });

	async.waterfall([
		function defineAppStack(next) {
			cloudFormation.defineStack({
				StackName: name + '-app',
				TemplateBody: rfile('./app/cloudformation.json'),
				Parameters: [{
					ParameterKey: 'Service',
					ParameterValue: name
				}, {
					ParameterKey: 'DockercfgS3Bucket',
					ParameterValue: bucket
				}],
				Capabilities: ['CAPABILITY_IAM']
			}, next);
		},
		function defineEnvStack(stack, next) {
			var cloudformationTemplate = args.cloudformationTemplate || 'cloudformation.json';

			var DockercfgRole = _.result(_.find(stack.Outputs, { OutputKey: 'DockercfgRole' }), 'OutputValue');

			cloudFormation.defineStack({
				StackName: name + '-env' + env,
				TemplateBody: jsonfile.readFileSync(cloudformationTemplate),
				Parameters: [{
					ParameterKey: 'Service',
					ParameterValue: name
				}, {
					ParameterKey: 'DockercfgRole',
					ParameterValue: DockercfgRole
				}, {
					ParameterKey: 'Environment',
					ParameterValue: env
				}],
				Capabilities: ['CAPABILITY_IAM']
			}, next);
			next();
		}
	], function(err) {
		console.log('all done!', err);
	});
};

//cloudFormation.describeStackResource(params, done);
