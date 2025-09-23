import { GradeEntity } from "src/grade/entity/grade.entity";
import { QuestionEntity } from "src/question/entity/question.entity";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


@Entity({name: 'User'})
export class UserEntity{
    @PrimaryGeneratedColumn('uuid')
    id: string

    @OneToMany(() => GradeEntity, (grade: GradeEntity) => grade.user, {cascade: true})
    grades: GradeEntity[];

    @OneToMany(() => QuestionEntity, (question: QuestionEntity) => question.author)
    createdQuestions: QuestionEntity[];

    @OneToMany(() => QuestionEntity, (question: QuestionEntity) => question.moderator)
    moderatedQuestions: QuestionEntity[];

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}