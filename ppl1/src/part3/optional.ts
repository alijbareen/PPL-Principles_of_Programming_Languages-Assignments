/* Question 1 */
export type Optional<T> = {tag: 'Some', value:T}|{tag: 'None'};

export const makeSome = <T>(value: T): Optional<T> => ({tag:'Some', value:value});
export const makeNone = <T>(): Optional<T> => ({tag:'None'});

export const isSome = <T>(x: Optional<T>): x is Optional<T> => x.tag==='Some';
export const isNone = <T>(x: Optional<T>): x is Optional<T> => x.tag==='None';

/* Question 2 */
export const bind = <T,U> (optional: Optional<T>, f:(x:T)=>Optional<U>): Optional<U> =>
    optional.tag==='None'? makeNone():f(optional.value);


