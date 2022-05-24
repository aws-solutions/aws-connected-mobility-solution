declare module 'cfn-response-promise' {
    export function send(event:any, context:any, responseStatus:string, responseData: any, physicalResourceId?:string): any;
}
