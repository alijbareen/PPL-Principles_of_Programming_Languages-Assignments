/* Question 3 */

import { reduce } from "ramda";

export type Result<T> = {tag:'Ok', value:T}|{tag:'Failure', message:string};

export const makeOk = <T>(value:T): Result<T> => ({tag:'Ok', value:value});
export const makeFailure = <T>(message:string): Result<T> => ({tag:'Failure', message:message});

export const isOk = <T>(x: Result<T>): x is Result<T> => x.tag==='Ok';
export const isFailure = <T>(x: Result<T>): x is Result<T> => x.tag==='Failure';

/* Question 4 */
export const bind = <T,U> (result: Result<T>, f:(x:T)=>Result<U>):Result<U>=>
    result.tag==='Failure'? result:
    f(result.value)

/* Question 5 */
interface User {
    name: string;
    email: string;
    handle: string;
}

const validateName = (user: User): Result<User> =>
    user.name.length === 0 ? makeFailure("Name cannot be empty") :
    user.name === "Bananas" ? makeFailure("Bananas is not a name") :
    makeOk(user);

const validateEmail = (user: User): Result<User> =>
    user.email.length === 0 ? makeFailure("Email cannot be empty") :
    user.email.endsWith("bananas.com") ? makeFailure("Domain bananas.com is not allowed") :
    makeOk(user);

const validateHandle = (user: User): Result<User> =>
    user.handle.length === 0 ? makeFailure("Handle cannot be empty") :
    user.handle.startsWith("@") ? makeFailure("This isn't Twitter") :
    makeOk(user);

export const naiveValidateUser = (user: User):Result<User> =>
isFailure(validateName(user))? validateName(user):
isFailure(validateEmail(user))? validateEmail(user):
isFailure(validateHandle(user))? validateHandle(user):
makeOk(user)

export const monadicValidateUser = (user: User):Result<User> =>
reduce(bind, validateName(user), [validateEmail, validateHandle]);
