/**
 * @license
 * Copyright 2017 Palantir Technologies, Inc.
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
import { AbstractRule } from "./abstractRule";
import { RuleFailure, Fix, IOptions } from "./rule";

export type SyntaxHandler = (ctx: FastWalkContext, node: ts.Node) => void;

type HandlerMap = { [key: number]: SyntaxHandler[]; };
type OwnerMap = { [key: number]: FastRule[]; };
type RuleAndHandlers = {
    handlers: HandlerMap;
    owners: OwnerMap;
}

export type Register = (kinds: ts.SyntaxKind | Array<ts.SyntaxKind>, handler: SyntaxHandler) => void;
export interface FastWalkRegistrar {
    before: Register;
    on: Register;
    after: Register;
}

export class FastWalkContext {
    private failures: RuleFailure[] = [];

    private currentRule: FastRule | undefined;
    public sourceFile: ts.SourceFile;

    private before: RuleAndHandlers = { handlers: {}, owners: {} };
    private on: RuleAndHandlers = { handlers: {}, owners: {} };
    private after: RuleAndHandlers = { handlers: {}, owners: {} };

    constructor() {

    }

    public addRule(rule: FastRule) {
        rule.register({
            before: (kinds, handler) => this.registerHandlers(this.before, kinds, rule, handler),
            on: (kinds, handler) => this.registerHandlers(this.on, kinds, rule, handler),
            after: (kinds, handler) => this.registerHandlers(this.after, kinds, rule, handler)
        });
    }

    /** Add a failure with any arbitrary span. Prefer `addFailureAtNode` if possible. */
    public addFailureAt(start: number, width: number, failure: string, fix?: Fix) {
        this.addFailure(start, start + width, failure, fix);
    }

    public addFailure(start: number, end: number, failure: string, fix?: Fix) {
        const fileLength = this.sourceFile!.end;
        
        const ruleFailure = new RuleFailure(this.sourceFile!,
            Math.min(start, fileLength),
            Math.min(end, fileLength),
            failure,
            this.currentRule!.ruleName,
            fix);
        if (!this.currentRule!.isFailureFiltered(ruleFailure)) {
            this.failures.push(ruleFailure);
        }
    }

    /** Add a failure using a node's span. */
    public addFailureAtNode(node: ts.Node, failure: string, fix?: Fix) {
        this.addFailure(node.getStart(this.sourceFile), node.getEnd(), failure, fix);
    }

    public execute(file: ts.SourceFile): RuleFailure[] {
        this.sourceFile = file;
        const before = this.before, on = this.on, after = this.after;
        const self = this;

        ts.forEachChild(file, visit);

        this.sourceFile = <any>undefined;
        const result = this.failures;
        this.failures = [];
        return result;

        function visit(node: ts.Node) {
            run(node, before);
            run(node, on);
            ts.forEachChild(node, visit);
            run(node, after);
        }

        function run(node: ts.Node, rh: RuleAndHandlers) {
            if (rh.handlers[node.kind]) {
                for (let i = 0; i < rh.handlers[node.kind].length; i++) {
                    self.currentRule = rh.owners[node.kind][i];
                    rh.handlers[node.kind][i](self, node);
                }
            }
        }
    }

    private registerHandler(map: RuleAndHandlers, kind: ts.SyntaxKind, rule: FastRule, handler: SyntaxHandler) {
        if (map.handlers[kind] === undefined) {
            map.handlers[kind] = [handler];
            map.owners[kind] = [rule];
        } else {
            map.handlers[kind].push(handler);
            map.owners[kind].push(rule);
        }
    }

    private registerHandlers(map: RuleAndHandlers, kinds: ts.SyntaxKind | Array<ts.SyntaxKind>, rule: FastRule, handler: SyntaxHandler) {
        if (Array.isArray(kinds)) {
            for(const k of kinds) {
                this.registerHandler(map, k, rule, handler);
            }
        } else {
            this.registerHandler(map, kinds, rule, handler);
        }
    }
}

/**
 * Fast rules are syntactic-only rules which can be executed as part of
 * a shared walk of a syntax tree.
 */
export abstract class FastRule extends AbstractRule {
    constructor(options: IOptions) {
        super(options);
    }
    /**
     * In your register method, add listeners to the tree syntax kinds you
     * need to be notified on.
     */
    abstract register(registrar: FastWalkRegistrar): void;

    public apply(_sourceFile: ts.SourceFile): RuleFailure[] {
        throw new Error("Should not be called");
    }
}
