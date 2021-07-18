import { Container } from 'react-bootstrap';
import Colors from '../../resources/Colors'
import { Transaction } from '../../models/index'
import NumberFormat from 'react-number-format';
import Moment from 'moment';


export type TransactionViewProps = {
    transaction: Transaction,
}

export default function TransactionView({ transaction }: TransactionViewProps) {

    const styles = {
        text: {
            padding: '8px',
            color: Colors.text,
        }
    }

    return (
        <Container>
            <NumberFormat value={transaction.amount / 100} allowEmptyFormatting={true} decimalScale={2} fixedDecimalScale={true} displayType={'text'} thousandSeparator={true} prefix={'$'} />
            <label style={styles.text}>{Moment(transaction.date).format('d MMMM')}</label>
            <label style={styles.text}>{transaction.status}</label>
        </Container>
    )
}
