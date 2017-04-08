/**
 * @license
 * Copyright 2013 Palantir Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as ts from "typescript";
import * as Lint from "../index";

export class Rule extends Lint.Rules.FastRule {
    /* tslint:disable:object-literal-sort-keys */
    public static metadata: Lint.IRuleMetadata = {
        ruleName: "class-name",
        description: "Enforces PascalCased class and interface names.",
        rationale: "Makes it easy to differentiate classes from regular variables at a glance.",
        optionsDescription: "Not configurable.",
        options: null,
        optionExamples: ["true"],
        type: "style",
        typescriptOnly: false,
    };
    /* tslint:enable:object-literal-sort-keys */

    public static FAILURE_STRING = "Class name must be in pascal case";

    register(context: Lint.Rules.FastWalkRegistrar) {
        context.on(ts.SyntaxKind.ClassDeclaration, checkClass);
        context.on(ts.SyntaxKind.InterfaceDeclaration, checkInterface);
    }
}

function checkClass(ctx: Lint.Rules.FastWalkContext, node: ts.ClassDeclaration) {
    if (node.name === undefined) return;

    const className = (node.name as ts.Identifier).text;
    if (!isPascalCased(className)) {
        ctx.addFailureAtNode(node.name, Rule.FAILURE_STRING);
    }
}

function checkInterface(ctx: Lint.Rules.FastWalkContext, node: ts.InterfaceDeclaration) {
    const interfaceName = (node.name as ts.Identifier).text;
    if (!isPascalCased(interfaceName)) {
        ctx.addFailureAtNode(node.name, Rule.FAILURE_STRING);
    }
}

function isPascalCased(name: string) {
    if (name.length <= 0) {
        return true;
    }

    const firstCharacter = name.charAt(0);
    return ((firstCharacter === firstCharacter.toUpperCase()) && name.indexOf("_") === -1);
}
