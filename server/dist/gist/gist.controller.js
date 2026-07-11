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
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { GistService } from './gist.service.js';
let GistController = class GistController {
    gistService;
    constructor(gistService) {
        this.gistService = gistService;
    }
    create(body) {
        return this.gistService.create(body);
    }
    update(id, body) {
        return this.gistService.update(id, body);
    }
    fork(id, revision, body) {
        return this.gistService.fork(body);
    }
    load(id, revision) {
        return this.gistService.load(id, revision);
    }
};
__decorate([
    Post(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GistController.prototype, "create", null);
__decorate([
    Patch(':id'),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GistController.prototype, "update", null);
__decorate([
    Post(':id/:revision'),
    __param(0, Param('id')),
    __param(1, Param('revision')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], GistController.prototype, "fork", null);
__decorate([
    Get(':id/:revision'),
    __param(0, Param('id')),
    __param(1, Param('revision')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], GistController.prototype, "load", null);
GistController = __decorate([
    Controller('api/v1/gist'),
    __metadata("design:paramtypes", [GistService])
], GistController);
export { GistController };
