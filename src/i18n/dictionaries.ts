import 'server-only'
import { lang } from 'next/root-params'
import { notFound } from 'next/navigation'

const dictionaries = {
  en: () => import('../../messages/en.json').then((m) => m.default),
  fr: () => import('../../messages/fr.json').then((m) => m.default),
}

export type Locale = keyof typeof dictionaries

export const hasLocale = (locale: string): locale is Locale =>
  locale in dictionaries

export const getDictionary = async () => {
  const locale = await lang()
  if (!hasLocale(locale)) notFound()
  return dictionaries[locale]()
}

export const getDictionaryByLocale = async (locale: string) => {
  if (!hasLocale(locale)) notFound()
  return dictionaries[locale]()
}
