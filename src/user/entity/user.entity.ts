import { GradeEntity } from "src/grade/entity/grade.entity";
import { QuestionEntity } from "src/question/entity/question.entity";
import { ThemeEntity } from "src/theme/entity/theme.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


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

    @ManyToOne(() => ThemeEntity, (theme) => theme.activeUsers, {nullable: true})
    chosenTheme: ThemeEntity | null;

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}