import { Transaction } from '../../models/index'
import TransactionView from './TransactionView'


export type TransactionListViewProps = {
    transactions: Transaction[],
}

export default function TransactionListView({ transactions }: TransactionListViewProps) {

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
