import { AccessLevel } from "src/common/enums/AccessLevel.enum";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({name: 'Authorize'})
export class AuthorizeEntity{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({unique: true})
    userName: string; 
    
    @Column({unique: true})
    email: string;

    @Column({})
    hash: string;

    @Column({
        name: 'access_level', 
        enum: AccessLevel, 
        enumName: 'AccessLevel', 
        default: AccessLevel.Default,
        type: 'enum',
    })
    accessLevel: AccessLevel;

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}