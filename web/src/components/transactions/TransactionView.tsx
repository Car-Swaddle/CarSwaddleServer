import { Transaction } from '../../models/index'
import NumberFormat from 'react-number-format';
import Moment from 'moment';


export type TransactionViewProps = {
    transaction: Transaction,
}

export default function TransactionView({ transaction }: TransactionViewProps) {

    return (
        <tr>
            <td><NumberFormat value={transaction.amount / 100} allowEmptyFormatting={true} decimalScale={2} fixedDecimalScale={true} displayType={'text'} thousandSeparator={true} prefix={'$'} /></td>
            <td>{Moment(transaction.date).format('d MMMM')}</td>
            <td>{transaction.status}</td>
        </tr>
    )
}


/*
<Container>
            <NumberFormat value={transaction.amount / 100} allowEmptyFormatting={true} decimalScale={2} fixedDecimalScale={true} displayType={'text'} thousandSeparator={true} prefix={'$'} />
            <label style={styles.text}>{Moment(transaction.date).format('d MMMM')}</label>
            <label style={styles.text}>{transaction.status}</label>
        </Container>

*/