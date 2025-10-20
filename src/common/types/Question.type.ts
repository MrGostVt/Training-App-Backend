import { ThemeEntity } from "src/theme/entity/theme.entity"
import { QuestionLevel } from "../enums/QuestionLevel.enum"
import { QuestionType } from "../enums/QuestionType.enum"

export type DefaultQuestion = {
    id: string,
    title: string,
    level: QuestionLevel,
    maxPoints: number,
    type: QuestionType,
    answers: any[],
    rightAnswers: any[]
}

export type GenericQuestionData = {
    title: string,
    rightAnswers: any[],
    answers: any[],
    patternId?: string,
}

export type QuestionData = {
    theme: ThemeEntity
} & DefaultQuestion