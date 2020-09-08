

function* gen1() : Generator{
    yield 1;
    yield 3;
    yield 5;
    yield 7;
    yield 9;
}
function* gen2() : Generator{
    yield 2;
    yield 4;
    yield 6;
    yield 8;
    yield 10;
}



export function* take (n: number , generator: Generator){
    for(let x of generator){
        if(n <= 0){
            return;
        }
        n--;
        yield x;
    }
}



export function* braid(generator1: () => Generator, generator2: () => Generator) :Generator{
    const g1 = generator1();
    const g2 = generator2();

    let gens = [g1, g2];

    let nxt1 = g1.next();
    let nxt2 = g2.next();

    while(!nxt1.done || !nxt2.done){
        if(!nxt1.done){
            yield nxt1.value;
        }
        if(!nxt2.done){
            yield nxt2.value;
        }

        nxt1 = g1.next();
        nxt2 = g2.next();

    }
}

function​*​ biased(g1: () => Generator, g2: () => Generator): Generator {
    let gen1 = g1();
    let gen2 = g2();
    let nxt1=gen1.next().value;
    let nxt2=gen2.next().value;

    while (nxt1!=undefined || nxt2!=undefined)
    {
        if (nxt1!=undefined)
        {
            yield nxt1
            nxt1=gen1.next().value
        }
        if (nxt1!=undefined)
        {
            yield nxt1
            nxt1=gen1.next().value
        }
        if (nxt2!=undefined)
        {
            yield nxt2
            nxt2=gen2.next().value
        }

    }
}




for (let n of take(10, braid(gen1,gen2))) {
    //console.log(n);
    process.stdout.write(n + " ");
}


console.log("\n");

for (let n of take(10, biased(gen1,gen2))) {
    //console.log(n);
    process.stdout.write(n + " ");
}
    