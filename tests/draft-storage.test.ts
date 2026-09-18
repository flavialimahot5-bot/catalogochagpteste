import test from 'node:test';
import assert from 'node:assert/strict';
import { BlobNotFoundError, BlobAccessError, BlobStoreNotFoundError } from '@vercel/blob';
import { readDraftStore } from '../lib/draft-storage';
test('first use of cloud drafts treats the real SDK missing-blob exception as an empty list',async()=>{
 const error=new BlobNotFoundError();
 assert.notEqual(error.name,'BlobNotFoundError');
 assert.deepEqual(await readDraftStore('test',async()=>{throw error;}),{products:[],operations:[]});
});
test('local missing file initializes drafts, while access/store/network/JSON errors remain visible',async()=>{
 assert.deepEqual(await readDraftStore('test',async()=>{throw Object.assign(new Error('missing'),{code:'ENOENT'});}),{products:[],operations:[]});
 for(const error of [new BlobAccessError(),new BlobStoreNotFoundError(),new Error('Network failure')])await assert.rejects(readDraftStore('test',async()=>{throw error;}),e=>e===error);
 await assert.rejects(readDraftStore('test',async()=>Buffer.from('invalid JSON')),SyntaxError);
 const stored={products:[],operations:['previous-operation']};
 assert.deepEqual(await readDraftStore('test',async()=>Buffer.from(JSON.stringify(stored))),stored);
});
