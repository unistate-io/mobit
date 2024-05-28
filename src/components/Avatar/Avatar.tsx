import BoringAvatar from 'boring-avatars';

function Avatar({name, size, colors}: {name: string, size:number, colors: string[]}) {
    return (<BoringAvatar
        size={size}
        name={name.slice(0, 10)}
        variant="beam"
        colors={colors}
    />)
}

export default Avatar
