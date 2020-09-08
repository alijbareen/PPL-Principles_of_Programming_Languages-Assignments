import { expect } from 'chai';
import { parseL4, makePrimOp } from './L4-ast';
import { listPrim } from "./evalPrimitive";
import { evalNormalParse, evalNormalProgram } from './L4-normal';
import { isClosure, Value } from './L4-value';
import { makeOk, isOk, Result, bind } from "../shared/result";

describe('L4 Normal Eval', () => {
    it('evaluates atoms', () => {
        expect(evalNormalParse("1")).to.deep.equal(makeOk(1));
        expect(evalNormalParse("#t")).to.deep.equal(makeOk(true));
        expect(evalNormalParse("+")).to.deep.equal(makeOk(makePrimOp("+")));
    });

    it('evaluates primitive procedures', () => {
        expect(evalNormalParse("(+ 1 2)")).to.deep.equal(makeOk(3));
        expect(evalNormalParse("(< 1 2)")).to.deep.equal(makeOk(true));
        expect(evalNormalParse("(not (> 1 2))")).to.deep.equal(makeOk(true));
        expect(evalNormalParse("(+ (* 2 2) 3)")).to.deep.equal(makeOk(7));
    });

    it('evaluates L2 syntactic forms', () => {
        expect(evalNormalParse("(if (< 1 2) 3 -3)")).to.deep.equal(makeOk(3));
        expect(evalNormalParse("(lambda (x) x)")).to.satisfy((e: Result<Value>) => isOk(e) && isClosure(e.value));
    });

    it('evaluates L3 syntactic forms', () => {
        expect(evalNormalParse("(cons 1 '())")).to.deep.equal(makeOk(listPrim([1])));
        expect(evalNormalParse("(car '(1 2))")).to.deep.equal(makeOk(1));
        expect(evalNormalParse("(cdr '(1 2))")).to.deep.equal(makeOk(listPrim([2])));
        expect(evalNormalParse("(number? 'x)")).to.deep.equal(makeOk(false));
        expect(evalNormalParse("(number? 1)")).to.deep.equal(makeOk(true));
        expect(evalNormalParse("(symbol? 'x)")).to.deep.equal(makeOk(true));
        expect(evalNormalParse("(symbol? 1)")).to.deep.equal(makeOk(false));
        expect(evalNormalParse("(pair? 1)")).to.deep.equal(makeOk(false));
        expect(evalNormalParse("(pair? '(1 2))")).to.deep.equal(makeOk(true));
        expect(evalNormalParse("(boolean? 1)")).to.deep.equal(makeOk(false));
        expect(evalNormalParse("(boolean? #t)")).to.deep.equal(makeOk(true));
        expect(evalNormalParse("(eq? 'x 'x)")).to.deep.equal(makeOk(true));
    });

    it('evaluates programs', () => {
        expect(bind(parseL4(`(L4 (define x (+ 3 2)) (* x x))`), evalNormalProgram)).to.deep.equal(makeOk(25));
        expect(bind(parseL4(`(L4 (define x (+ 3 2)) (* x x) (+ x x))`), evalNormalProgram)).to.deep.equal(makeOk(10));
    });

    it('evaluates procedures', () => {
        expect(bind(parseL4(`(L4 (define f (lambda (x) (* x x))) (f 3))`), evalNormalProgram)).to.deep.equal(makeOk(9));
        expect(bind(parseL4(`(L4 (define f (lambda (x) (if (> x 0) x (- 0 x)))) (f -3))`), evalNormalProgram)).to.deep.equal(makeOk(3));
    });

    it('evaluates recursive procedures', () => {
       expect(bind(parseL4(`(L4 (define f
                                  (lambda (x)
                                    (if (= x 0)
                                        1
                                        (* x (f (- x 1))))))
                                (f 5))`), evalNormalProgram)).to.deep.equal(makeOk(120));
    });

    it('evaluates higher-order functions', () => {
        expect(bind(parseL4(`
            (L4 (define map
                  (lambda (f l)
                    (if (eq? l '())
                        l
                        (cons (f (car l)) (map f (cdr l))))))
                (map (lambda (x) (* x x)) '(1 2 3)))`), evalNormalProgram)).to.deep.equal(makeOk(listPrim([1, 4, 9])));

        expect(bind(parseL4(`
            (L4 (define empty? (lambda (x) (eq? x '())))
                (define filter (lambda (pred l)
                                 (if (empty? l)
                                     l
                                     (if (pred (car l))
                                         (cons (car l) (filter pred (cdr l)))
                                         (filter pred (cdr l))))))
                (filter (lambda (x) (not (= x 2))) '(1 2 3 2)))`), evalNormalProgram)).to.deep.equal(makeOk(listPrim([1, 3])));

        expect(bind(parseL4(`
            (L4 (define compose (lambda (f g) (lambda (x) (f (g x)))))
                ((compose not number?) 2))`), evalNormalProgram)).to.deep.equal(makeOk(false));
    });

    it('evaluates the examples', () => {
        // Preserve bound variables in subst
        expect(bind(parseL4(`
            (L4 (define nf
                  (lambda (f n)
                    (if (= n 0)
                        (lambda (x) x)
                        (if (= n 1)
                            f
                            (lambda (x) (f ((nf f (- n 1)) x)))))))
                ((nf (lambda (x) (* x x)) 2) 3))`), evalNormalProgram)).to.deep.equal(makeOk(81));

        // Accidental capture of the z variable if no renaming
        expect(bind(parseL4(`
            (L4 (define z (lambda (x) (* x x)))
                (((lambda (x) (lambda (z) (x z))) (lambda (w) (z w))) 2))`), evalNormalProgram)).to.deep.equal(makeOk(4));

        // Y-combinator
        expect(bind(parseL4(`
            (L4 (((lambda (f) (f f))
                    (lambda (fact)
                      (lambda (n)
                        (if (= n 0)
                            1
                            (* n ((fact fact) (- n 1))))))) 6))`), evalNormalProgram)).to.deep.equal(makeOk(720));
    });

    it('evaluates programs which would loop in applicative order, but complete in normal order', () => {
        expect(bind(parseL4(`
            (L4 (define loop (lambda () (loop)))
                (define f (lambda (x y z) (if (= x 1) y z)))
                (f 1 2 (loop)))`), evalNormalProgram)).to.deep.equal(makeOk(2));

        expect(bind(parseL4(`
        (L4 (define loop (lambda (x) (loop x)))
            (define g (lambda (x) 5))
            (g (loop 0)))`), evalNormalProgram)).to.deep.equal(makeOk(5));
    });

    it('evaluates programs which would give an error in applicative order, but not in normal order', () => {
        expect(bind(parseL4(`
            (L4 (define try
                  (lambda (a b)
                    (if (= a 0)
                        1
                        b)))
                (try 0 (/ 1 0)))`), evalNormalProgram)).to.deep.equal(makeOk(1));
    });

    it('evaluates programs which would cause side-effects in applicative order, but not in normal order', () => {
        expect(bind(parseL4(`
            (L4 (define f (lambda (x) (display x) (newline) (+ x 1)))
                (define g (lambda (x) 5))
                (g (f 0)))`), evalNormalProgram)).to.deep.equal(makeOk(5));
    });

    it('additional test 1', () => {
        expect(bind(parseL4(`(L4
                                  (define x 999)
                                  (define y 5)
                                  (define f
                                  (lambda (x)
                                    (if (= x 0)
                                        1
                                        (* x (f (- x 1))))))
                                (f y))`), evalNormalProgram)).to.deep.equal(makeOk(120));

        expect(bind(parseL4(`(L4
                                  (define x 5)
                                  (define y 999)
                                  (define f
                                  (lambda (x)
                                    (if (= x 0)
                                        (let ((x 1)) x)
                                        (* x (f (- x 1))))))
                                (f x))`), evalNormalProgram)).to.deep.equal(makeOk(120));
    });

    it('additional test 2', () => {
        expect(bind(parseL4(`(L4 (let ((a 1) (b #t)) (if b a (+ a 1))))`), evalNormalProgram)).to.deep.equal(makeOk(1));

        expect(bind(parseL4(`(L4 (let ((f (lambda (n) (if (= n 0) 1 (* n (f (- n 1))))))) (f 5)))`), evalNormalProgram)).to.deep.equal(makeOk(120));
    });

    it('additional test 3', () => {
        expect(bind(parseL4(`(L4 (define f (lambda (x y)
                                (if (= x y)
                                    (let ((y (* x x))) y)
                                    (f (- x 1) (+ y 1)))))
                                (f 9 5))`), evalNormalProgram)).to.deep.equal(makeOk(49));
    });

    it('additional test 4 - properly captures variables in closures', () => {
        expect(bind(parseL4(`
            (L4 (define makeAdder (lambda (n) (lambda (y) (+ y n))))
                (define a6 (makeAdder 6))
                (define a7 (makeAdder 7))
                (+ (a6 1) (a7 1)))`), evalNormalProgram)).to.deep.equal(makeOk(15));
    });

    it('additional test 5 - evaluates mutual recursion', () => {
        expect(bind(parseL4(`
            (L4 (define odd? (lambda (n) (if (= n 0) #f (even? (- n 1)))))
                (define even? (lambda (n) (if (= n 0) #t (odd? (- n 1)))))
                (and (odd? 5) (even? 6)))`), evalNormalProgram)).to.deep.equal(makeOk(true));
    });

    it('additional test 6 - example from the clarification', () => {
        expect(bind(parseL4(`(L4 (define id (lambda (x) x))
                                (define x 5)
                                (id (- x 1)))`), evalNormalProgram)).to.deep.equal(makeOk(4));
    });
});
