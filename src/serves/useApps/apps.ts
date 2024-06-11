export interface CkbApp {
    logo: string,
    name: string,
    url: string
    description: string
}

const apps: CkbApp[] = [
    {
        logo: 'https://ik.imagekit.io/soladata/z8hkvqw5_4OsLMde3-',
        name: 'Huehub',
        url: 'https://huehub.xyz/',
        description: 'RGB++ Assets Marketplace'
    },
    {
        logo: 'https://ik.imagekit.io/soladata/i3830dqr_plNHCLl-G',
        name: '.bit',
        url: 'https://did.id/',
        description: 'Unified DID, Access From Anywhere, Use It Everywhere'
    },
    {
        logo: 'https://ik.imagekit.io/soladata/dx2hgk3e_0OXl2mDX9',
        name: 'Omiga',
        url: 'https://omiga.io/',
        description: 'The first  inscription protocol builded on CKB, also an orderbook DEX supports xUDT, DOBs.'
    },
    {
        logo: 'https://ik.imagekit.io/soladata/1vx4du4f_uz_lSWILL',
        name: 'Mobit',
        url: '/',
        description: 'CKB 生态的资产管理器'
    },
    {
        logo: 'https://ik.imagekit.io/soladata/8wcdvj7q_JPAaU7bA5',
        name: 'CKB Explorer',
        url: 'https://explorer.nervos.org/',
        description: 'CKB Block Explorer'
    }
]

export default apps
