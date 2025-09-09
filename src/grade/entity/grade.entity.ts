import { QuestionEntity } from "src/question/entity/question.entity";
import { ThemeEntity } from "src/theme/entity/theme.entity";
import { UserEntity } from "src/user/entity/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


@Entity({name: 'Grade'})
export class GradeEntity{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => UserEntity, (user: UserEntity) => user.grades)
    user: UserEntity;
    
    @OneToOne(() => ThemeEntity, (theme: ThemeEntity) => theme.grade)
    theme: ThemeEntity;

    @Column({type: 'int', default: 0})
    grade: number;
    
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}