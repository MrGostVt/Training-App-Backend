import { GradeEntity } from "src/grade/entity/grade.entity";
import { QuestionEntity } from "src/question/entity/question.entity";
import { Column, CreateDateColumn, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({name: 'Theme'})
export class ThemeEntity{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({unique: true})
    title: string; 
    
    @OneToMany(() => QuestionEntity, (question: QuestionEntity) => question.theme)
    questions: QuestionEntity[];

    @OneToOne(() => GradeEntity, (grade: GradeEntity) => grade.theme)
    grade: GradeEntity;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}