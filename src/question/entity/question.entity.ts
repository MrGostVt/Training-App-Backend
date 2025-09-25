import { QuestionLevel } from "src/common/enums/QuestionLevel.enum";
import { QuestionType } from "src/common/enums/QuestionType.enum";
import { ThemeEntity } from "src/theme/entity/theme.entity";
import { UserEntity } from "src/user/entity/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({name: 'Question'})
export class QuestionEntity{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({unique: true})
    title: string; 
    
    @Column({type: 'enum', enum: QuestionLevel, enumName: 'QuestionLevel', default: QuestionLevel.easy})
    level: QuestionLevel;

    @Column({name: 'max_points', type: 'int'})
    maxPoints: number;

    @Column({type: 'enum', enum: QuestionType, enumName: 'QuestionType', default: QuestionType.default})
    type: QuestionType;

    @Column({type: 'varchar', array: true})
    answers: string[];
    
    @Column({name: 'right_answers', type: 'varchar', array: true})
    rightAnswers: number[];

    @ManyToOne(() => ThemeEntity, (theme: ThemeEntity) => theme.questions, {cascade: true})
    theme: ThemeEntity;

    @Column({name: 'is_moderated', type: 'boolean', default: false})
    isModerated: boolean;

    @ManyToOne(() => UserEntity, (user: UserEntity) => user.createdQuestions)
    author: UserEntity;

    @ManyToOne(() => UserEntity, (user: UserEntity) => user.moderatedQuestions, {nullable: true})
    moderator: UserEntity;

    @Column({name: 'last_moderator_passport', type: 'varchar', nullable: true})
    lastModeratorPassport: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}