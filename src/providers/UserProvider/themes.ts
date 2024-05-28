export interface UserTheme {
    colors: string[],
    bg: string,
    text: string
}

export const themes: UserTheme[] = [
    {
        "colors": ["#F83673", "#f1f1f1", "#F4B26D"],
        bg: "linear-gradient(92deg, #F1F6FF 1.08%, #FFF4F4 58.78%, #FFF6ED 100%)",
        text: 'linear-gradient(93deg, #2E67CA 9.45%, #F83673 55.67%, #F4B26D 100%)'
    },
    {
        "colors": ["#7175D9", "#f1f1f1", "#F4EF6D"],
        bg: "linear-gradient(92deg, #EDFEFF 4.17%, #F1FFF3 57.24%, #FFF8ED 100%)",
        text: 'linear-gradient(93deg, #7175D9 9.45%, #4ADE97 55.67%, #F4EF6D 100%)'
    },
    {
        "colors": ["#FFEB39", "#f1f1f1", "#84CE26"],
        bg: "linear-gradient(92deg, #F1FFF2 1.08%, #FFF9ED 58.78%, #FFF1F6 100%)",
        text: 'linear-gradient(93deg, #FF5E98 9.45%, #FFEB39 62.74%, #84CE26 100%)'
    },
]

export const getTheme = (address: string) => {
    const index = parseInt(address, 16) % themes.length
    return themes[index]
}

export const defaultTheme = {
    colors: ["#333333", "#666666", "#f1f1f1"],
    bg: "linear-gradient(92deg, #F1F6FF 1.08%, #FFF4F4 58.78%, #FFF6ED 100%)",
    text: 'linear-gradient(93deg, #2E67CA 9.45%, #F83673 55.67%, #F4B26D 100%)'
}
