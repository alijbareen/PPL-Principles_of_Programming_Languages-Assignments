// L5-typecheck
// ========================================================
import { equals, map, zipWith, chain } from 'ramda';
import { isAppExp, isBoolExp, isDefineExp, isIfExp, isLetrecExp, isLetExp, isNumExp,
         isPrimOp, isProcExp, isProgram, isStrExp, isVarRef, parseL5Exp, unparse,
         AppExp, BoolExp, DefineExp, Exp, IfExp, LetrecExp, LetExp, NumExp,
         Parsed, PrimOp, ProcExp, Program, StrExp, isValuesExp, isLetValuesExp, ValuesExp, CExp, LetvaluesExp, BindingValues, VarDecl } from "./L5-ast";
import { applyTEnv, makeEmptyTEnv, makeExtendTEnv, TEnv } from "./TEnv";
import { isProcTExp, makeBoolTExp, makeNumTExp, makeProcTExp, makeStrTExp, makeVoidTExp,
         parseTE, unparseTExp,
         BoolTExp, NumTExp, StrTExp, TExp, VoidTExp, makeEmptyTupleTExp, isNonTupleTExp, makeNonEmptyTupleTExp } from "./TExp";
import { isEmpty, allT, first, rest } from '../shared/list';
import { Result, makeFailure, bind, makeOk, safe3, safe2, zipWithResult, mapResult, isOk } from '../shared/result';
import { parse as p } from "../shared/parser";
import { SExpValue, isTuple } from './L5-value';



// Purpose: Check that type expressions are equivalent
// as part of a fully-annotated type check process of exp.
// Return an error if the types are different - true otherwise.
// Exp is only passed for documentation purposes.
const checkEqualType = (te1: TExp, te2: TExp, exp: Exp): Result<true> =>
  equals(te1, te2) ? makeOk(true) :
  safe3((te1: string, te2: string, exp: string) => makeFailure<true>(`Incompatible types: ${te1} and ${te2} in ${exp}`))
    (unparseTExp(te1), unparseTExp(te2), unparse(exp));

// Compute the type of L5 AST exps to TE
// ===============================================
// Compute a Typed-L5 AST exp to a Texp on the basis
// of its structure and the annotations it contains.

// Purpose: Compute the type of a concrete fully-typed expression
export const L5typeof = (concreteExp: string): Result<string> =>
    bind(bind(p(concreteExp), parseL5Exp),
         (e: Exp) => bind(typeofExp(e, makeEmptyTEnv()), unparseTExp));

// Purpose: Compute the type of an expression
// Traverse the AST and check the type according to the exp type.
// We assume that all variables and procedures have been explicitly typed in the program.
export const typeofExp = (exp: Parsed, tenv: TEnv): Result<TExp> =>
    isNumExp(exp) ? makeOk(typeofNum(exp)) :
    isBoolExp(exp) ? makeOk(typeofBool(exp)) :
    isStrExp(exp) ? makeOk(typeofStr(exp)) :
    isPrimOp(exp) ? typeofPrim(exp) :
    isVarRef(exp) ? applyTEnv(tenv, exp.var) :
    isIfExp(exp) ? typeofIf(exp, tenv) :
    isProcExp(exp) ? typeofProc(exp, tenv) :
    isAppExp(exp) ? typeofApp(exp, tenv) :
    isLetExp(exp) ? typeofLet(exp, tenv) :
    isLetrecExp(exp) ? typeofLetrec(exp, tenv) :
    isDefineExp(exp) ? typeofDefine(exp, tenv) :
    isProgram(exp) ? typeofProgram(exp, tenv) :
    //NEW
    isValuesExp(exp)? typeofValues(exp, tenv):
    isLetValuesExp(exp)? typeofletvalues(exp, tenv):
    // Skip isSetExp(exp) isLitExp(exp)
    makeFailure("Unknown type");


// Purpose: Compute the type of a sequence of expressions
// Check all the exps in a sequence - return type of last.
// Pre-conditions: exps is not empty.
export const typeofExps = (exps: Exp[], tenv: TEnv): Result<TExp> =>
    isEmpty(rest(exps)) ? typeofExp(first(exps), tenv) :
    bind(typeofExp(first(exps), tenv), _ => typeofExps(rest(exps), tenv));

// a number literal has type num-te
export const typeofNum = (n: NumExp): NumTExp => makeNumTExp();

// a boolean literal has type bool-te
export const typeofBool = (b: BoolExp): BoolTExp => makeBoolTExp();



 //ValuesExp {tag: "Values"; val: CExp[]; }
 export const typeofValues = (exps: ValuesExp, tenv: TEnv): Result<TExp> =>{
    let texpVal = mapResult((x:CExp)=>typeofExp(x, tenv),exps.val)

    return isOk(texpVal)? 
            isEmpty(texpVal)? 
                makeOk(makeEmptyTupleTExp()):
            allT(isNonTupleTExp, texpVal.value)? 
                makeOk(makeNonEmptyTupleTExp(texpVal.value)):
                makeFailure("tuple in tuple - typesofvalues"):
        makeFailure(texpVal.message)
}     


export const typeofletvalues = (exps: LetvaluesExp, tenv: TEnv): Result<TExp> =>{

    const varsD = map((b: BindingValues) => b.vars, exps.bindings);
    const varsA = varsD.reduce((acc,curr) => acc.concat(curr), [])
    const varsS = mapVarDecls(varsD);
    const varsT = map((b) => b.texp, varsA);
    return typeofExps(exps.body, makeExtendTEnv(varsS, varsT, tenv));
}

export const mapVarDecls = (exp: VarDecl[][]): string[]=>{
    const mapedVarDecls =  exp.reduce((acc,curr) => acc.concat(curr), [])
    return (map((v:VarDecl)=>v.var,mapedVarDecls));
 }



// a string literal has type str-te
const typeofStr = (s: StrExp): StrTExp => makeStrTExp();

// primitive ops have known proc-te types
const numOpTExp = parseTE('(number * number -> number)');
const numCompTExp = parseTE('(number * number -> boolean)');
const boolOpTExp = parseTE('(boolean * boolean -> boolean)');
const typePredTExp = parseTE('(T -> boolean)');

// Todo: cons, car, cdr
export const typeofPrim = (p: PrimOp): Result<TExp> =>
    ['+', '-', '*', '/'].includes(p.op) ? numOpTExp :
    ['and', 'or'].includes(p.op) ? boolOpTExp :
    ['>', '<', '='].includes(p.op) ? numCompTExp :
    ['number?', 'boolean?', 'string?', 'symbol?', 'list?'].includes(p.op) ? typePredTExp :
    (p.op === 'not') ? parseTE('(boolean -> boolean)') :
    (p.op === 'eq?') ? parseTE('(T1 * T2 -> boolean)') :
    (p.op === 'string=?') ? parseTE('(T1 * T2 -> boolean)') :
    (p.op === 'display') ? parseTE('(T -> void)') :
    (p.op === 'newline') ? parseTE('(Empty -> void)') :
    makeFailure(`Unknown primitive ${p.op}`);


// Purpose: compute the type of an if-exp
// Typing rule:
//   if type<test>(tenv) = boolean
//      type<then>(tenv) = t1
//      type<else>(tenv) = t1
// then type<(if test then else)>(tenv) = t1
export const typeofIf = (ifExp: IfExp, tenv: TEnv): Result<TExp> => {
    const testTE = typeofExp(ifExp.test, tenv);
    const thenTE = typeofExp(ifExp.then, tenv);
    const altTE = typeofExp(ifExp.alt, tenv);
    const constraint1 = bind(testTE, testTE => checkEqualType(testTE, makeBoolTExp(), ifExp));
    const constraint2 = safe2((thenTE: TExp, altTE: TExp) => checkEqualType(thenTE, altTE, ifExp))(thenTE, altTE);
    return safe2((_c1: true, _c2: true) => thenTE)(constraint1, constraint2);
};

// Purpose: compute the type of a proc-exp
// Typing rule:
// If   type<body>(extend-tenv(x1=t1,...,xn=tn; tenv)) = t
// then type<lambda (x1:t1,...,xn:tn) : t exp)>(tenv) = (t1 * ... * tn -> t)
export const typeofProc = (proc: ProcExp, tenv: TEnv): Result<TExp> => {
    const argsTEs = map((vd) => vd.texp, proc.args);
    const extTEnv = makeExtendTEnv(map((vd) => vd.var, proc.args), argsTEs, tenv);
    const constraint1 = bind(typeofExps(proc.body, extTEnv),
                             (body: TExp) => checkEqualType(body, proc.returnTE, proc));
    return bind(constraint1, _ => makeOk(makeProcTExp(argsTEs, proc.returnTE)));
};

// Purpose: compute the type of an app-exp
// Typing rule:
// If   type<rator>(tenv) = (t1*..*tn -> t)
//      type<rand1>(tenv) = t1
//      ...
//      type<randn>(tenv) = tn
// then type<(rator rand1...randn)>(tenv) = t
// We also check the correct number of arguments is passed.
export const typeofApp = (app: AppExp, tenv: TEnv): Result<TExp> =>
    bind(typeofExp(app.rator, tenv), (ratorTE: TExp) => {
        if (! isProcTExp(ratorTE)) {
            return safe2((rator: string, exp: string) => makeFailure<TExp>(`Application of non-procedure: ${rator} in ${exp}`))
                    (unparseTExp(ratorTE), unparse(app));
        }
        if (app.rands.length !== ratorTE.paramTEs.length) {
            return bind(unparse(app), (exp: string) => makeFailure<TExp>(`Wrong parameter numbers passed to proc: ${exp}`));
        }
        const constraints = zipWithResult((rand, trand) => bind(typeofExp(rand, tenv),
                                                                (typeOfRand: TExp) => checkEqualType(typeOfRand, trand, app)),
                                          app.rands, ratorTE.paramTEs);
        return bind(constraints, _ => makeOk(ratorTE.returnTE));
    });

// Purpose: compute the type of a let-exp
// Typing rule:
// If   type<val1>(tenv) = t1
//      ...
//      type<valn>(tenv) = tn
//      type<body>(extend-tenv(var1=t1,..,varn=tn; tenv)) = t
// then type<let ((var1 val1) .. (varn valn)) body>(tenv) = t
export const typeofLet = (exp: LetExp, tenv: TEnv): Result<TExp> => {
    const vars = map((b) => b.var.var, exp.bindings);
    const vals = map((b) => b.val, exp.bindings);
    const varTEs = map((b) => b.var.texp, exp.bindings);
    const constraints = zipWithResult((varTE, val) => bind(typeofExp(val, tenv),
                                                           (typeOfVal: TExp) => checkEqualType(varTE, typeOfVal, exp)),
                                      varTEs, vals);
    return bind(constraints, _ => typeofExps(exp.body, makeExtendTEnv(vars, varTEs, tenv)));
};

// Purpose: compute the type of a letrec-exp
// We make the same assumption as in L4 that letrec only binds proc values.
// Typing rule:
//   (letrec((p1 (lambda (x11 ... x1n1) body1)) ...) body)
//   tenv-body = extend-tenv(p1=(t11*..*t1n1->t1)....; tenv)
//   tenvi = extend-tenv(xi1=ti1,..,xini=tini; tenv-body)
// If   type<body1>(tenv1) = t1
//      ...
//      type<bodyn>(tenvn) = tn
//      type<body>(tenv-body) = t
// then type<(letrec((p1 (lambda (x11 ... x1n1) body1)) ...) body)>(tenv-body) = t
export const typeofLetrec = (exp: LetrecExp, tenv: TEnv): Result<TExp> => {
    const ps = map((b) => b.var.var, exp.bindings);
    const procs = map((b) => b.val, exp.bindings);
    if (! allT(isProcExp, procs))
        return makeFailure(`letrec - only support binding of procedures - ${exp}`);
    const paramss = map((p) => p.args, procs);
    const bodies = map((p) => p.body, procs);
    const tijs = map((params) => map((p) => p.texp, params), paramss);
    const tis = map((proc) => proc.returnTE, procs);
    const tenvBody = makeExtendTEnv(ps, zipWith((tij, ti) => makeProcTExp(tij, ti), tijs, tis), tenv);
    const tenvIs = zipWith((params, tij) => makeExtendTEnv(map((p) => p.var, params), tij, tenvBody),
                           paramss, tijs);
    const types = zipWithResult((bodyI, tenvI) => typeofExps(bodyI, tenvI), bodies, tenvIs)
    const constraints = bind(types, (types: TExp[]) => zipWithResult((typeI, ti) => checkEqualType(typeI, ti, exp), types, tis));
    return bind(constraints, _ => typeofExps(exp.body, tenvBody));
};

// Typecheck a full program
// TODO: Thread the TEnv (as in L1)

// Purpose: compute the type of a define
// Typing rule:
//   (define (var : texp) val)
// TODO - write the true definition
export const typeofDefine = (exp: DefineExp, tenv: TEnv): Result<VoidTExp> => {
    // return Error("TODO");
    return makeOk(makeVoidTExp());
};

// Purpose: compute the type of a program
// Typing rule:
// TODO - write the true definition
export const typeofProgram = (exp: Program, tenv: TEnv): Result<TExp> =>
    makeFailure("TODO");


export const sameLen = (vars: VarDecl[][], vals: SExpValue[][]): boolean =>{
        let check = true;
        let i=0;
        for (i = 0; i < vars.length; i++){
            if (vars[i].length !== vals[i].length)
                check = false;
              }
        return check;
}
    

export const getTupless = (v: SExpValue): Result<SExpValue[]> => 
    isTuple(v) ? makeOk(v.list) : makeFailure(`non-tuple: ${JSON.stringify(v)}`)

    
export const getSexp = (vals: SExpValue[][]): SExpValue[] => 
    chain((x) => x, vals); 
 

export const getVarDecs = (exp: VarDecl[][]): string[]=>{
   const mapedVarDecls =  exp.reduce((acc,curr) => acc.concat(curr), []);
   return (map((v:VarDecl)=>v.var,mapedVarDecls))  ;
}


  