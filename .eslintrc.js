const typescriptEslintRecommended = require('@typescript-eslint/eslint-plugin/dist/configs/recommended')

const baseConfig = {
    env: {
        browser: true,
        es6: true,
        commonjs: true,
        node: true,
    },
    extends: ['airbnb', 'eslint:recommended'],
    parser: '@babel/eslint-parser',
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
        ecmaFeatures: {
            arrowFunctions: true,
            binaryLiterals: true,
            classes: true,
            defaultParams: true,
            destructuring: true,
            jsx: true,
            modules: true,
            spread: true,
            templateStrings: true,
        },
    },
    plugins: [
        'react',
        'react-hooks',
        'unused-imports',
    ],
    rules: {
        // All eslint rules: http://eslint.org/docs/rules/
        strict: ['off', 'global'],
        indent: ['warn', 4, {
            SwitchCase: 1,
        }],

        // Imports
        'import/prefer-default-export': 'off',
        'import/extensions': ['error', 'ignorePackages', {
            js: 'never',
            jsx: 'never',
            ts: 'never',
            tsx: 'never',
        }],
        'import/order': ['error', {
            'newlines-between': 'always',
            groups: [
                ['builtin', 'external'],
                'internal',
                ['parent', 'sibling'],
                'index'
            ],
            pathGroups: [
                {
                    pattern: '@/**',
                    group: 'internal'
                }
            ],
            pathGroupsExcludedImportTypes: ['builtin']
        }],
        'sort-imports': ['error', {
            allowSeparatedGroups: true,
            ignoreCase: true,
            ignoreDeclarationSort: true,
        }],

        // Style
        'array-bracket-spacing': 'warn',
        'comma-dangle': ['warn', 'always-multiline'],
        'comma-style': ['warn', 'last'],
        'computed-property-spacing': ['warn', 'never'],
        'block-spacing': 'warn',
        'brace-style': ['warn', 'stroustrup', {
            allowSingleLine: true,
        }],
        'linebreak-style': ['warn', 'unix'],
        'max-len': ['error', {
            code: 120,
            ignoreUrls: true,
            ignoreComments: true,
            ignoreTrailingComments: true,
            ignoreRegExpLiterals: true,
            ignoreStrings: true,
            ignoreTemplateLiterals: true,
        }],
        'new-cap': ['error', {
            properties: false,
        }],
        'no-multiple-empty-lines': ['warn', {
            max: 2,
        }],
        'no-await-in-loop': 'off',
        'no-continue': 'off',
        'no-plusplus': ['error', {
            allowForLoopAfterthoughts: true,
        }],
        'no-trailing-spaces': ['error', {
            skipBlankLines: false,
            ignoreComments: true,
        }],
        'no-underscore-dangle': ['off', {
            allowAfterThis: true,
            allowAfterSuper: true,
            enforceInMethodNames: false,
        }],
        'object-curly-spacing': ['warn', 'always', {
            objectsInObjects: false,
            arraysInObjects: true,
        }],
        'one-var': ['error', {
            var: 'always',
            let: 'consecutive',
            const: 'never',
        }],
        'jsx-quotes': ['warn', 'prefer-double'],
        'key-spacing': ['warn', {
            beforeColon: false,
            afterColon: true,
            mode: 'minimum',
        }],
        'keyword-spacing': 'warn',
        'padded-blocks': ['error', {
            classes: 'always',
        }],
        quotes: ['warn', 'single', {
            avoidEscape: true,
        }],
        semi: ['warn', 'never'],
        'semi-spacing': ['warn', {
            before: false,
            after: true,
        }],
        'space-before-blocks': ['warn', 'always'],
        'space-in-parens': ['warn', 'never'],
        'space-unary-ops': ['warn', {
            words: true,
            nonwords: false,
        }],

        // Possible errors
        'no-console': ['warn', {
            allow: ['warn', 'error'],
        }],
        'no-empty': ['warn', {
            allowEmptyCatch: true,
        }],

        // Variables
        'no-catch-shadow': 'error',
        'no-shadow': ['error', {
            hoist: 'never',
        }],

        // Best practices
        'no-param-reassign': ['error', {
            props: true,
            ignorePropertyModificationsFor: [
                'acc', // for reduce accumulators
                'accumulator', // for reduce accumulators
                'e', // for e.returnvalue
                'staticContext', // for ReactRouter context
                'options',
            ],
        }],

        // EcmaScript 6
        'arrow-parens': ['warn', 'as-needed'],
        'arrow-spacing': ['warn', {
            before: true,
            after: true,
        }],

        // Plugin: eslint-plugin-jsx-a11y
        'jsx-a11y/no-static-element-interactions': 'off',
        'jsx-a11y/click-events-have-key-events': 'off',
        'jsx-a11y/no-noninteractive-element-interactions': 'off',
        'jsx-a11y/label-has-associated-control': 'off',
        'jsx-a11y/no-autofocus': 'off',

        // Plugin: eslint-plugin-react
        // Full list: https://github.com/yannickcr/eslint-plugin-react
        'react/jsx-boolean-value': 'warn',
        'react/jsx-closing-bracket-location': ['warn', 'tag-aligned'],
        'react/jsx-curly-spacing': ['warn', 'never'],
        'react/jsx-max-props-per-line': ['error', {
            maximum: 3,
        }],
        'react/jsx-props-no-spreading': 'off',
        'react/jsx-no-duplicate-props': ['warn', {
            ignoreCase: true,
        }],
        'react/jsx-filename-extension': ['warn', {
            extensions: ['.js', '.jsx', '.tsx'],
        }],
        'react/jsx-indent': ['warn', 4],
        'react/jsx-indent-props': ['warn', 4],
        'react/jsx-no-undef': 'warn',
        'react/jsx-uses-react': 'warn',
        'react/jsx-uses-vars': 'warn',
        'react/jsx-no-useless-fragment': 'off',
        'react/jsx-wrap-multilines': 'warn',
        'react/no-direct-mutation-state': 'warn',
        'react/no-multi-comp': 'warn',
        'react/no-unknown-property': 'warn',
        'react/prop-types': ['warn', {
            ignore: ['children', 'className', 'style'],
            skipUndeclared: true,
        }],
        'react/require-default-props': 'off',
        'react/forbid-prop-types': 'off',
        'react/destructuring-assignment': ['warn', 'always', {
            ignoreClassFields: true,
        }],
        'react/react-in-jsx-scope': 'warn',
        'react/self-closing-comp': 'warn',
        'react/no-danger': 'off',
        'react/function-component-definition': ['error', {
            'namedComponents': 'function-declaration',
            'unnamedComponents': 'function-expression',
        }]
    },
    settings: {
        'import/resolver': {
            'eslint-import-resolver-webpack': {},
            node: {
                extensions: ['.js', '.jsx'],
            },
        },
        'import/extensions': ['.js', '.jsx'],
    },
}

const typescriptConfig = {
    ...baseConfig,
    extends: [
        ...baseConfig.extends,
        'plugin:import/typescript',
    ],
    overrides: [
        {
            files: ['*.d.ts'],
            rules: {
                camelcase: 'off',
                'max-len': 'off',
            },
        },
        {
            files: ['*.ts{,x}'],
            ...baseConfig,
            parser: '@typescript-eslint/parser', // Specifies the ESLint parser
            plugins: [...baseConfig.plugins, '@typescript-eslint'],
            parserOptions: {
                ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
                sourceType: 'module', // Allows for the use of imports
                ecmaFeatures: {
                    jsx: true, // Allows for the parsing of JSX
                },
            },
            rules: {
                ...typescriptEslintRecommended.rules,
                ...baseConfig.rules,
                '@typescript-eslint/ban-types': 'off',
                '@typescript-eslint/ban-ts-ignore': 'off',
                '@typescript-eslint/ban-ts-comment': ['error', {
                    'ts-expect-error': 'allow-with-description',
                    'ts-ignore': false,
                    'ts-nocheck': true,
                    'ts-check': false,
                    minimumDescriptionLength: 5,
                }],
                '@typescript-eslint/explicit-function-return-type': ['off', {
                    allowExpressions: true,
                    allowHigherOrderFunctions: true,
                    allowTypedFunctionExpressions: true,
                }],
                '@typescript-eslint/explicit-module-boundary-types': ['warn', {
                    allowArgumentsExplicitlyTypedAsAny: true,
                    allowTypedFunctionExpressions: true,
                }],
                '@typescript-eslint/no-dupe-class-members': 'error',
                '@typescript-eslint/no-empty-function': ['error', {
                    allow: ['methods'],
                }],
                '@typescript-eslint/no-explicit-any': 'off',
                '@typescript-eslint/no-inferrable-types': 'off',
                '@typescript-eslint/no-non-null-assertion': 'off',
                '@typescript-eslint/no-shadow': 'error',
                '@typescript-eslint/no-unused-vars': ['error', {
                    argsIgnorePattern: '^_',
                }],
                '@typescript-eslint/no-use-before-define': 'error',
                '@typescript-eslint/lines-between-class-members': ['error', 'always', {
                    exceptAfterOverload: true,
                }],
                camelcase: 'off',
                'lines-between-class-members': 'off',
                'no-dupe-class-members': 'off',
                'no-redeclare': 'off',
                'no-shadow': 'off',
                'no-undef': 'off',
                'no-unused-vars': 'off',
                'no-use-before-define': 'off',
                'no-useless-constructor': 'off',
                'react/prop-types': 'off',
                'unused-imports/no-unused-vars': 'off',
                'unused-imports/no-unused-imports': 'off',
                'unused-imports/no-unused-vars-ts': ['warn', {
                    argsIgnorePattern: '^_',
                    args: 'all',
                    ignoreRestSiblings: true,
                }],
                'unused-imports/no-unused-imports-ts': 'error',
            },
            settings: {
                'import/parsers': {
                    '@typescript-eslint/parser': ['.ts', '.tsx', '.d.ts'],
                },
                'import/external-module-folders': [
                    'node_modules',
                    'node_modules/@types',
                ],
                'import/resolver': {
                    typescript: {},
                    node: {
                        // Allow import and resolve for *.ts modules.
                        extensions: ['.js', '.jsx', '.mjs', '.ts', '.tsx'],
                    },
                },
                'import/extensions': ['.js', '.jsx', '.mjs', '.ts', '.tsx'],
            },
        },
    ],
}

module.exports = typescriptConfig
