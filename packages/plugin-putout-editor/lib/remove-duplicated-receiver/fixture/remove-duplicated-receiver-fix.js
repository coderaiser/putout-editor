const {workbench} = getState();
const value = workbench && workbench.code;
const {text} = el();

const label = text && text.trim();

const safe = q.r && q.r.s();

const deeper = obj.a.b && obj.a.b.c();

const code = 'x';

const taken = code && code.y();

const kind = 'x';

const clash = f().kind && f().kind.value;
const deep = f();

const bare = deep && deep.deep;
const f = this.f();

const self = f && f.x;

const arrow = (el) => {
    const {title} = el();
    return title && title.trim();
};

const blocked = (el) => {
    const {name} = el();
    
    return name && name.trim();
};

const normal = function(el) {
    const {size} = el();
    
    return size && size.valueOf();
};
