import { pair ,concat, reject ,KeyValuePair } from "ramda";
import { resolve } from "dns";
import { SlowBuffer } from "buffer";



//Question 1
export function f(x: number): Promise<number> {
    return new Promise<number>((resolve : any, reject: any) => {
        if (x === 0) {
            reject("ERROR in function f : division by 0 !");
            return;
        }
            resolve(1 / x);
    });
}


export function g(x: number): Promise<number> {
    return new Promise<number>((resolve, reject) => {
            resolve(x * x);
            return;
    });
}


export function h(x: number): Promise<number> {
    return new Promise<number>((resolve, reject) => {
       g(x)
        .then((res) => f(res) )
        .then((res) => resolve(res) )
        .catch((error) => reject(error) );
    });
}



  



//Question2
export const slower = <T>(proms :[Promise<any>, Promise<any>]):Promise <any> => {
    return new Promise(resolve => {
      const wrap_promise = (index: number) => (value: T) => {
        if(race.add(index).size === 2){
            resolve(`(${index}, ${value})`)
        }
      }
      const race=new Set
      proms.map((prom,index)=>{
      prom.then(wrap_promise(index))
      })
    })
  }




const promise1 = new Promise((resolve, reject) => setTimeout(resolve, 1000, 'one'));
const promise2 = new Promise((resolve, reject) => setTimeout(resolve, 200, 'two'));

const p1 = new Promise(function(resolve , reject){
    setTimeout(resolve , 1000 , 'bla');
});

const p2 = new Promise(function(resolve , reject){
    setTimeout(resolve , 500 , 'boom');
});


slower([p1,p2]).then(function(value){
    console.log(value);
});

slower([promise1, promise2])
    .then((value) => console.log(value))
    .catch((message) => console.log("reject:" + message));
