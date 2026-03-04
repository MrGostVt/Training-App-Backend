import { GradeEntity } from "src/grade/entity/grade.entity";
import { PatternsEntity } from "src/question-generator/entity/patterns.entity";
import { QuestionEntity } from "src/question/entity/question.entity";
import { UserEntity } from "src/user/entity/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ThemeEntity } from "./theme.entity";
import { IntegrationMethods } from "src/common/enums/IntegrationMethods";

@Entity({name: 'Integration'})
export class IntegrationEntity{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    service: string;

    @OneToOne(() => ThemeEntity, (theme) => theme.integration)
    theme: ThemeEntity;

    @Column({type: 'varchar'})
    params: string;

    @Column({type: 'varchar'})
    headers: string;

    @Column({type: 'enum', enum: IntegrationMethods, enumName: 'IntegrationMethods'})
    method: IntegrationMethods;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}