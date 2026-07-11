var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
let ParseService = class ParseService {
    snippets;
    snippetRevisions;
    constructor(snippets, snippetRevisions) {
        this.snippets = snippets;
        this.snippetRevisions = snippetRevisions;
    }
    async load(snippetId, revisionId) {
        const snippet = this.snippets.get(snippetId);
        if (!snippet) {
            throw new NotFoundException('Not found');
        }
        let revisionIndex;
        if (revisionId === 'latest') {
            revisionIndex = snippet.revisions.length - 1;
        }
        else {
            revisionIndex = Number(revisionId);
        }
        if (revisionIndex !== revisionIndex || revisionIndex >= snippet.revisions.length) {
            throw new NotFoundException('Not found');
        }
        const revision = this.snippetRevisions.get(snippet.revisions[revisionIndex].objectId);
        if (!revision) {
            throw new NotFoundException('Not found');
        }
        const { _id, ...rest } = revision;
        return {
            revisionID: revisionIndex,
            snippetID: snippet._id,
            ...rest,
        };
    }
};
ParseService = __decorate([
    Injectable(),
    __param(0, Inject('SNIPPETS')),
    __param(1, Inject('SNIPPET_REVISIONS')),
    __metadata("design:paramtypes", [Map,
        Map])
], ParseService);
export { ParseService };
