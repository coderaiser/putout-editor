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
import { Controller, Get, Param } from '@nestjs/common';
import { ParseService } from './parse.service.js';
let ParseController = class ParseController {
    parseService;
    constructor(parseService) {
        this.parseService = parseService;
    }
    load(snippetId, revisionId) {
        return this.parseService.load(snippetId, revisionId);
    }
};
__decorate([
    Get(':snippetid/:revisionid'),
    __param(0, Param('snippetid')),
    __param(1, Param('revisionid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ParseController.prototype, "load", null);
ParseController = __decorate([
    Controller('api/v1/parse'),
    __metadata("design:paramtypes", [ParseService])
], ParseController);
export { ParseController };
