import { Injectable } from '@nestjs/common';

type Data = {
    payload: object,
    timer: NodeJS.Timeout | null,
}

@Injectable()
export class RamDbService {
    private data: Object = {};

    addEntry(key: string, payload: any, timer: {func: () => {}, time: number} | null): boolean{
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
        return this.data[key].payload;
    }
}
