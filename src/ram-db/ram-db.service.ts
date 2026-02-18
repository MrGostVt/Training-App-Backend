import { Injectable } from '@nestjs/common';

type Data = {
    payload: object,
    timer: NodeJS.Timeout | null,
}

@Injectable()
export class RamDbService {
    private data: Object = {};

    addEntry(key: string, payload: any, timer: {func: () => void, time: number} | null): boolean{
        if(!!this.data[key]){
            return false;
        }

        const entry: Data = {
            payload,
            timer: !!timer? setTimeout(timer.func, timer.time): null,
        }
        
        this.data[key] = entry;
        return true;
    }

    addGenericEntry(args: [string, any], timer: {func: () => {}, time: number}){
        const [key, payload] = args;
        return this.addEntry(key, payload, timer);
    }

    deleteEntry(key: string): boolean{
        try{
            if(!!this.data[key].timer){
                clearTimeout(this.data[key].timer);
            }
            delete this.data[key];
        }
        catch{
            return false;
        }
        return true;
    }
    findEntry(key: string): any{
        if(!this.data[key]){
            return undefined;
        }
        return {...this.data[key].payload};
    }
    checkEntry(key: string): boolean{
        return this.data[key] && true || false;
    }

    //TimeFormat: '5m' '5h' '15s'
    formatTime(time: string): number | null{
        const measures = {
            'm': 1000 * 60,
            'h': 1000 * 60 * 60,
            's': 1000,
        };

        const measure = time.split('').filter((val) => Object.keys(measures).includes(val))[0];

        if(!measure){
            return null;
        }
        const delay = (+time.split(measure)[0]) * measures[measure];


        return Number.isNaN(delay)? null: delay;
    }
}
