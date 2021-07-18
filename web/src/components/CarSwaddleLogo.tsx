type CarSwaddleLogoProps = {
    width?: string,
    height?: string
}


export default function CarSwaddleLogo({ width, height }: CarSwaddleLogoProps) {

    const styles = {
        logoImage: {
            maxHeight: height,
            maxWidth: width
        }
    }
    
    return (
        <div className="mt-4 mb-3 text-center"><img src={`/img/cs-logo.png`} style={styles.logoImage} alt='Car Swaddle Logo'/></div>
    )
}