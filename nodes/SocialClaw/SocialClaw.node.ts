import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
	NodeConnectionType,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

/**
 * Programmatic SocialClaw node. Wraps the SocialClaw REST API
 * (https://getsocialclaw.com/docs/api). Auth is the SocialClawApi credential
 * (Bearer header + base URL).
 *
 * Resources:
 *   Account → List, Get Capabilities
 *   Post    → Schedule, Validate, List, Get, Get Status, Cancel, Get Analytics
 *   Media   → Upload (from binary)
 */
export class SocialClaw implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SocialClaw',
		name: 'socialClaw',
		icon: 'file:socialclaw.svg',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Schedule and publish social media posts via SocialClaw',
		defaults: { name: 'SocialClaw' },
		inputs: ['main'] as NodeConnectionType[],
		outputs: ['main'] as NodeConnectionType[],
		credentials: [{ name: 'socialClawApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Post', value: 'post' },
					{ name: 'Account', value: 'account' },
					{ name: 'Media', value: 'media' },
				],
				default: 'post',
			},

			// ---------- Account operations ----------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['account'] } },
				options: [
					{ name: 'List', value: 'list', action: 'List connected accounts' },
					{
						name: 'Get Capabilities',
						value: 'capabilities',
						action: 'Get account capabilities',
					},
				],
				default: 'list',
			},

			// ---------- Post operations ----------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['post'] } },
				// Ordered by workflow (schedule first) rather than alphabetically for usability.
				// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
				options: [
					{ name: 'Schedule / Publish', value: 'schedule', action: 'Schedule or publish a post' },
					{ name: 'Validate', value: 'validate', action: 'Validate a post before publishing' },
					{ name: 'List', value: 'list', action: 'List posts' },
					{ name: 'Get', value: 'get', action: 'Get a post' },
					{ name: 'Get Status', value: 'status', action: 'Get post status' },
					{ name: 'Cancel', value: 'cancel', action: 'Cancel or delete a post' },
					{ name: 'Get Analytics', value: 'analytics', action: 'Get post analytics' },
				],
				default: 'schedule',
			},

			// ---------- Media operations ----------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['media'] } },
				options: [{ name: 'Upload', value: 'upload', action: 'Upload a media asset' }],
				default: 'upload',
			},

			// ---------- Fields: Account ----------
			{
				displayName: 'Provider',
				name: 'provider',
				type: 'string',
				default: '',
				placeholder: 'x, linkedin, instagram_business, tiktok, …',
				description: 'Optional. Filter to one provider. Leave empty for all.',
				displayOptions: { show: { resource: ['account'], operation: ['list', 'capabilities'] } },
			},
			{
				displayName: 'Account ID',
				name: 'accountIdForCaps',
				type: 'string',
				default: '',
				description: 'Optional. Capabilities for a single account (overrides Provider).',
				displayOptions: { show: { resource: ['account'], operation: ['capabilities'] } },
			},

			// ---------- Fields: Post → Schedule / Validate ----------
			{
				displayName: 'Account ID',
				name: 'account',
				type: 'string',
				default: '',
				required: true,
				description: 'Connected account to post through (from Account → List)',
				displayOptions: { show: { resource: ['post'], operation: ['schedule', 'validate'] } },
			},
			{
				displayName: 'Text',
				name: 'text',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
				required: true,
				description: 'Post body / caption',
				displayOptions: { show: { resource: ['post'], operation: ['schedule', 'validate'] } },
			},
			{
				displayName: 'Publish At',
				name: 'publishAt',
				type: 'dateTime',
				default: '',
				description: 'When to publish. Leave empty to publish immediately.',
				displayOptions: { show: { resource: ['post'], operation: ['schedule', 'validate'] } },
			},
			{
				displayName: 'Timezone',
				name: 'timezone',
				type: 'string',
				default: 'UTC',
				description: 'IANA timezone for the publish time, e.g. America/New_York',
				displayOptions: { show: { resource: ['post'], operation: ['schedule', 'validate'] } },
			},
			{
				displayName: 'Media URL',
				name: 'mediaLink',
				type: 'string',
				default: '',
				description: 'Optional. Hosted media URL (e.g. from Media → Upload).',
				displayOptions: { show: { resource: ['post'], operation: ['schedule', 'validate'] } },
			},
			{
				displayName: 'Post Name',
				name: 'postName',
				type: 'string',
				default: 'n8n post',
				description: 'A label for this post inside the run',
				displayOptions: { show: { resource: ['post'], operation: ['schedule', 'validate'] } },
			},

			// ---------- Fields: Post → Get / Status / Cancel / Analytics ----------
			{
				displayName: 'Post ID',
				name: 'postId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: { resource: ['post'], operation: ['get', 'status', 'cancel', 'analytics'] },
				},
			},
			{
				displayName: 'Window',
				name: 'window',
				type: 'string',
				default: '7d',
				description: 'Analytics window, e.g. 24h, 7d, 30d',
				displayOptions: { show: { resource: ['post'], operation: ['analytics'] } },
			},

			// ---------- Fields: Post → List ----------
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				description: 'Max number of results to return',
				typeOptions: { minValue: 1 },
				default: 50,
				displayOptions: { show: { resource: ['post'], operation: ['list'] } },
			},

			// ---------- Fields: Media → Upload ----------
			{
				displayName: 'Input Binary Field',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				description: 'Name of the binary property holding the file to upload',
				displayOptions: { show: { resource: ['media'], operation: ['upload'] } },
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('socialClawApi');
		const baseUrl = String(credentials.baseUrl || 'https://getsocialclaw.com').replace(/\/$/, '');

		const request = async (
			method: IHttpRequestMethods,
			path: string,
			body?: IDataObject,
			qs?: IDataObject,
		): Promise<IDataObject> => {
			return (await this.helpers.httpRequestWithAuthentication.call(this, 'socialClawApi', {
				method,
				url: `${baseUrl}${path}`,
				body,
				qs,
				json: true,
			})) as IDataObject;
		};

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				let response: IDataObject = {};

				if (resource === 'account') {
					if (operation === 'list') {
						const provider = this.getNodeParameter('provider', i, '') as string;
						response = await request(
							'GET',
							'/v1/accounts',
							undefined,
							provider ? { provider } : undefined,
						);
					} else if (operation === 'capabilities') {
						const accountId = this.getNodeParameter('accountIdForCaps', i, '') as string;
						const provider = this.getNodeParameter('provider', i, '') as string;
						if (accountId) {
							response = await request(
								'GET',
								`/v1/accounts/${encodeURIComponent(accountId)}/capabilities`,
							);
						} else {
							response = await request(
								'GET',
								'/v1/accounts/capabilities',
								undefined,
								provider ? { provider } : undefined,
							);
						}
					}
				} else if (resource === 'post') {
					if (operation === 'schedule' || operation === 'validate') {
						const account = this.getNodeParameter('account', i) as string;
						const text = this.getNodeParameter('text', i) as string;
						const publishAt = this.getNodeParameter('publishAt', i, '') as string;
						const timezone = this.getNodeParameter('timezone', i, 'UTC') as string;
						const mediaLink = this.getNodeParameter('mediaLink', i, '') as string;
						const postName = this.getNodeParameter('postName', i, 'n8n post') as string;

						const post: IDataObject = { account, name: postName, description: text };
						if (publishAt) post.publish_at = publishAt;
						if (mediaLink) post.media_link = mediaLink;
						const schedule: IDataObject = { timezone, posts: [post] };

						const endpoint = operation === 'schedule' ? '/v1/posts/apply' : '/v1/posts/validate';
						response = await request('POST', endpoint, { schedule });
					} else if (operation === 'list') {
						const limit = this.getNodeParameter('limit', i, 20) as number;
						response = await request('GET', '/v1/posts', undefined, { limit });
					} else if (operation === 'get') {
						const postId = this.getNodeParameter('postId', i) as string;
						response = await request('GET', `/v1/posts/${encodeURIComponent(postId)}`);
					} else if (operation === 'status') {
						const postId = this.getNodeParameter('postId', i) as string;
						response = await request('GET', `/v1/posts/${encodeURIComponent(postId)}/attempts`);
					} else if (operation === 'cancel') {
						const postId = this.getNodeParameter('postId', i) as string;
						response = await request('DELETE', `/v1/posts/${encodeURIComponent(postId)}`);
					} else if (operation === 'analytics') {
						const postId = this.getNodeParameter('postId', i) as string;
						const window = this.getNodeParameter('window', i, '7d') as string;
						response = await request(
							'GET',
							`/v1/analytics/posts/${encodeURIComponent(postId)}`,
							undefined,
							{ window },
						);
					}
				} else if (resource === 'media') {
					if (operation === 'upload') {
						const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
						const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
						const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
						response = await request('POST', '/v1/assets/upload', {
							filename: binaryData.fileName || 'upload.bin',
							contentType: binaryData.mimeType || 'application/octet-stream',
							contentBase64: buffer.toString('base64'),
						});
					}
				}

				returnData.push({ json: response, pairedItem: { item: i } });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
