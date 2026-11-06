import {handle,ApiError} from '../../../lib/server';
export const dynamic='force-dynamic';
async function route(r:Request){try{return await handle(r);}catch(e:any){if(e instanceof ApiError)return Response.json({error:e.message,...e.extra},{status:e.status});console.error('CampusFlow API error',e);return Response.json({error:'The request could not be completed. Please refresh and try again.'},{status:500});}}
export const GET=route;export const POST=route;
