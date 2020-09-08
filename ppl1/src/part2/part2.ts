/* Question 1 */
export const partition = <T>(predicate:(x:T) => boolean,  arr:Array<T>) : Array<Array<T>> => 
[arr.filter(predicate), arr.filter((data)=>!predicate(data))]

/* Question 2 */
export const mapMat = <T>(func: (x:T) => T, mat: Array<Array<T>>): Array<Array<T>> =>
mat.reduce((acc:Array<Array<T>> ,cur: Array<T>) => acc.concat([cur.map(func)]),[])

/* Question 3 */
export const composeMany = <T>(funcArr :Array<(x:T)=>T>):(x:T)=>T =>
funcArr.reduce((acc,func)=> (val:T)=>acc(func(val)), (x:T)=>x);

/* Question 4 */
interface Languages {
    english: string;
    japanese: string;
    chinese: string;
    french: string;
}

interface Stats {
    HP: number;
    Attack: number;
    Defense: number;
    "Sp. Attack": number;
    "Sp. Defense": number;
    Speed: number;
}

interface Pokemon {
    id: number;
    name: Languages;
    type: string[];
    base: Stats;
}

export const maxSpeed = (pokedex : Pokemon[]): Pokemon[] =>{
    let maxSpeed:number = pokedex.reduce((max, comp)=>Math.max(max,comp.base.Speed),0)
    return pokedex.filter((x:Pokemon)=>x.base.Speed===maxSpeed)
}

export const grassTypes = (pokedex : Pokemon[]): string[] =>{    
   let updatePokemon : Pokemon[] = pokedex.filter((x:Pokemon) => x.type.indexOf("Grass")!= -1)
   return updatePokemon.map((p:Pokemon)=> p.name.english).sort()
}


export const uniqueTypes = (pokedex : Pokemon[]): string[] =>{
    let typeArr: string[][] = pokedex.map((x:Pokemon)=>x.type);
    let flatArr: string[] = typeArr.reduce((acc,curr)=>acc.concat(curr),[])
    return flatArr.sort().filter(function(item, pos, ary) {
        return !pos || item != ary[pos - 1];
    })
}

    


