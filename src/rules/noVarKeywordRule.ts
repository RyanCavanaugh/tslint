/**
 * @license
 * Copyright 2015 Palantir Technologies, Inc.
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
        ruleName: "no-var-keyword",
        description: "Disallows usage of the `var` keyword.",
        descriptionDetails: "Use `let` or `const` instead.",
        hasFix: true,
        optionsDescription: "Not configurable.",
        options: null,
        optionExamples: ["true"],
        type: "functionality",
        typescriptOnly: false,
    };
    /* tslint:enable:object-literal-sort-keys */

    public static FAILURE_STRING = "Forbidden 'var' keyword, use 'let' or 'const' instead";

    register(context: Lint.Rules.FastWalkRegistrar) {
        context.on(ts.SyntaxKind.VariableStatement, checkVariableStatement);
        context.on([ts.SyntaxKind.ForStatement, ts.SyntaxKind.ForInStatement, ts.SyntaxKind.ForOfStatement], checkForStatement);
    }
}

function checkVariableStatement(ctx: Lint.FastWalkContext, node: ts.VariableStatement) {
    if (!Lint.hasModifier(node.modifiers, ts.SyntaxKind.DeclareKeyword)
        && !Lint.isBlockScopedVariable(node)) {
        reportFailure(ctx, node.declarationList);
    }
}

function checkForStatement(ctx: Lint.FastWalkContext, node: ts.ForStatement | ts.ForInStatement | ts.ForOfStatement) {
    handleInitializerNode(ctx, node.initializer);
}

function handleInitializerNode(ctx: Lint.FastWalkContext, node: ts.VariableDeclarationList | ts.Expression | undefined) {
    if (node && node.kind === ts.SyntaxKind.VariableDeclarationList &&
        !(Lint.isNodeFlagSet(node, ts.NodeFlags.Let) || Lint.isNodeFlagSet(node, ts.NodeFlags.Const))) {
        reportFailure(ctx, node);
    }
}

function reportFailure(ctx: Lint.FastWalkContext, node: ts.Node) {
    const nodeStart = node.getStart(ctx.sourceFile);
    ctx.addFailureAt(nodeStart, "var".length, Rule.FAILURE_STRING, new Lint.Replacement(nodeStart, "var".length, "let"));
}
