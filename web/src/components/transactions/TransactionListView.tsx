import Colors from '../../resources/Colors'
import { Transaction } from '../../models/index'
import TransactionView from './TransactionView'


export type TransactionListViewProps = {
    transactions: Transaction[],
}

export default function TransactionListView({ transactions }: TransactionListViewProps) {

    const styles = {
        text: {
            backgroundColor: Colors.errorAlpha,
            padding: '8px',
            color: Colors.text,
            borderRadius: '8px',
            border: `2px solid ${Colors.error}`
        }
    }

    function list(transactions: Array<Transaction>) {
        const views = transactions.map((transaction) =>
            <TransactionView key={transaction.transferID} transaction={transaction} />
        );
        return (
            <ul>
                {views}
            </ul>
        );
    }

    return (
        list(transactions)
    )
}
