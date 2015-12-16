/*
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

export class Rule extends Lint.Rules.AbstractRule {
    public static FAILURE_STRING = "statement has no side effects";

    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        return this.applyWithWalker(new StatementWalker(sourceFile, this.getOptions()));
    }
}

class StatementWalker extends Lint.RuleWalker {
    private results: boolean[] = [];

    public visitExpressionStatement(node: ts.ExpressionStatement) {
        this.results.push(false);
        super.visitExpressionStatement(node);
        let result = this.results.pop();
        if (!result) {
            this.addFailure(this.createFailure(node.getStart(), node.getWidth(), Rule.FAILURE_STRING));
        }
    }

    public visitCallExpression(node: ts.CallExpression) {
        super.visitCallExpression(node);
    }

    public visitNewExpression(node: ts.NewExpression) {
        super.visitNewExpression(node);
        this.setSuccess();
    }

    public visitBinaryExpression(node: ts.BinaryExpression) {
        super.visitBinaryExpression(node);
        switch (node.operatorToken.kind) {
            case ts.SyntaxKind.EqualsToken:
            case ts.SyntaxKind.PlusEqualsToken:
            case ts.SyntaxKind.MinusEqualsToken:
            case ts.SyntaxKind.AsteriskEqualsToken:
            case ts.SyntaxKind.SlashEqualsToken:
            case ts.SyntaxKind.CaretEqualsToken:
                this.setSuccess();
        }
    }

    public visitPrefixUnaryExpression(node: ts.PrefixUnaryExpression) {
        super.visitPrefixUnaryExpression(node);
        switch (node.kind) {
            case ts.SyntaxKind.PlusPlusToken:
            case ts.SyntaxKind.MinusMinusToken:
                this.setSuccess();
        }
    }

    public visitPostfixUnaryExpression(node: ts.PostfixUnaryExpression) {
        super.visitPostfixUnaryExpression(node);
        switch (node.kind) {
            case ts.SyntaxKind.PlusPlusToken:
            case ts.SyntaxKind.MinusMinusToken:
                this.setSuccess();
        }
    }

    private setSuccess() {
        this.results[this.results.length - 1] = true;
    }
}
