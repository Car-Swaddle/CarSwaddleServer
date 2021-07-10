import React from 'react';
import Colors from '../resources/Colors'


export type ErrorLabelProps = {
    text: string,
}

export default function ErrorLabel({ text }: ErrorLabelProps) {

    const styles = {
        text: {
            backgroundColor: Colors.errorAlpha,
            padding: '8px',
            color: Colors.text,
            borderRadius: '8px',
            border: `2px solid ${Colors.error}`
        }
    }

    return (
        <p style={styles.text}>{text}</p>
    )
}
