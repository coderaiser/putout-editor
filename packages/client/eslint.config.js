import {safeAlign} from 'eslint-plugin-putout';
import {defineConfig} from 'eslint/config';
import reactCompiler from 'eslint-plugin-react-compiler';
import boundaries from 'eslint-plugin-boundaries';
import {matchToFlat} from '@putout/eslint-flat';

export const match = {
    '**/*.spec.*': {
        'react-compiler/react-compiler': 'off',
    },
};

export default defineConfig([
    safeAlign, {
        plugins: {
            'react-compiler': reactCompiler,
        },
        rules: {
            'no-irregular-whitespace': 'off',
            'react-compiler/react-compiler': 'error',
            'n/no-unsupported-features/node-builtins': 'off',
            'putout/no-unresolved': 'off',
        },
    }, {
        plugins: {
            boundaries,
        },
        settings: {
            'boundaries/elements': [{
                type: 'editor',
                pattern: 'src/editor/**',
            }, {
                type: 'store',
                pattern: 'src/store/**',
            }, {
                type: 'parser',
                pattern: 'src/parser/**',
            }, {
                type: 'snippet',
                pattern: 'src/snippet/**',
            }, {
                type: 'ui',
                pattern: 'src/ui/**',
            }, {
                type: 'editor-source',
                pattern: 'src/editor-source/**',
            }, {
                type: 'editor-result',
                pattern: 'src/editor-result/**',
            }, {
                type: 'editor-ast-json',
                pattern: 'src/editor-ast-json/**',
            }, {
                type: 'editor-plugin',
                pattern: 'src/editor-plugin/**',
            }, {
                type: 'editor-ast-tree',
                pattern: 'src/editor-ast-tree/**',
            }, {
                type: 'menu',
                pattern: 'src/menu/**',
            }, {
                type: 'app',
                pattern: 'src/app/**',
            }],
        },
        rules: {
            'boundaries/dependencies': ['error', {
                default: 'disallow',
                policies: [{
                    from: {
                        element: {
                            type: 'editor',
                        },
                    },
                    allow: [],
                }, {
                    from: {
                        element: {
                            type: 'store',
                        },
                    },
                    allow: [{
                        to: {
                            element: {
                                type: 'editor',
                            },
                        },
                    }, {
                        to: {
                            element: {
                                type: 'parser',
                            },
                        },
                    }],
                }, {
                    from: {
                        element: {
                            type: 'parser',
                        },
                    },
                    allow: [{
                        to: {
                            element: {
                                type: 'editor',
                            },
                        },
                    }, {
                        to: {
                            element: {
                                type: 'store',
                            },
                        },
                    }],
                }, {
                    from: {
                        element: {
                            type: 'snippet',
                        },
                    },
                    allow: [{
                        to: {
                            element: {
                                type: 'editor',
                            },
                        },
                    }, {
                        to: {
                            element: {
                                type: 'store',
                            },
                        },
                    }, {
                        to: {
                            element: {
                                type: 'parser',
                            },
                        },
                    }],
                }, {
                    from: {
                        element: {
                            type: 'ui',
                        },
                    },
                    allow: [{
                        to: {
                            element: {
                                type: 'editor',
                            },
                        },
                    }, {
                        to: {
                            element: {
                                type: 'store',
                            },
                        },
                    }, {
                        to: {
                            element: {
                                type: 'parser',
                            },
                        },
                    }],
                }, {
                    from: {
                        element: {
                            type: 'editor-source',
                        },
                    },
                    allow: [{
                        to: {
                            element: {
                                type: 'editor',
                            },
                        },
                    }, {
                        to: {
                            element: {
                                type: 'store',
                            },
                        },
                    }, {
                        to: {
                            element: {
                                type: 'parser',
                            },
                        },
                    }],
                }, {
                    from: {
                        element: {
                            type: 'editor-result',
                        },
                    },
                    allow: [{
                        to: {
                            element: {
                                type: 'editor',
                            },
                        },
                    }, {
                        to: {
                            element: {
                                type: 'editor-ast-json',
                            },
                        },
                    }],
                }, {
                    from: {
                        element: {
                            type: 'editor-ast-json',
                        },
                    },
                    allow: [{
                        to: {
                            element: {
                                type: 'editor',
                            },
                        },
                    }],
                }, {
                    from: {
                        element: {
                            type: 'editor-plugin',
                        },
                    },
                    allow: [{
                        to: {
                            element: {
                                type: 'editor',
                            },
                        },
                    }, {
                        to: {
                            element: {
                                type: 'editor-result',
                            },
                        },
                    }, {
                        to: {
                            element: {
                                type: 'store',
                            },
                        },
                    }, {
                        to: {
                            element: {
                                type: 'parser',
                            },
                        },
                    }, {
                        to: {
                            element: {
                                type: 'ui',
                            },
                        },
                    }],
                }, {
                    from: {
                        element: {
                            type: 'editor-ast-tree',
                        },
                    },
                    allow: [{
                        to: {
                            element: {
                                type: 'editor',
                            },
                        },
                    }, {
                        to: {
                            element: {
                                type: 'editor-ast-json',
                            },
                        },
                    }, {
                        to: {
                            element: {
                                type: 'store',
                            },
                        },
                    }, {
                        to: {
                            element: {
                                type: 'parser',
                            },
                        },
                    }, {
                        to: {
                            element: {
                                type: 'snippet',
                            },
                        },
                    }],
                }, {
                    from: {
                        element: {
                            type: 'menu',
                        },
                    },
                    allow: [{
                        to: {
                            element: {
                                type: 'editor-plugin',
                            },
                        },
                    }, {
                        to: {
                            element: {
                                type: 'parser',
                            },
                        },
                    }, {
                        to: {
                            element: {
                                type: 'snippet',
                            },
                        },
                    }, {
                        to: {
                            element: {
                                type: 'store',
                            },
                        },
                    }],
                }, {
                    from: {
                        element: {
                            type: 'app',
                        },
                    },
                    allow: [{
                        to: {
                            element: {
                                type: '*',
                            },
                        },
                    }],
                }],
            }],
        },
    },
], matchToFlat(match));
