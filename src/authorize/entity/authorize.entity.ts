import { AccessLevel } from "src/common/enums/AccessLevel.enum";
import { Collection, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({name: 'Authorize'})
export class AuthorizeEntity{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    passport: string;

    @Column({unique: true})
    userName: string; 

    @Column({})
    hash: string;

    // @Column({
    //     name: 'access_level', 
    //     enum: AccessLevel, 
    //     enumName: 'AccessLevel', 
    //     default: AccessLevel.Default,
    //     type: 'enum',
    // })

    @Column({
        name: 'is_admin',
    })
    isAdmin: boolean;

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}