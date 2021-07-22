import { Transaction } from '../../models/index'
import { Container, Table } from 'react-bootstrap';
import TransactionView from './TransactionView'
import Colors from '../../resources/Colors';


export type TransactionListViewProps = {
    transactions: Transaction[],
}

export default function TransactionListView({ transactions }: TransactionListViewProps) {

    function list(transactions: Array<Transaction>) {
        const views = transactions.map((transaction) =>
            <TransactionView key={transaction.transferID} transaction={transaction} />
        );
        return (
            <>
                {views}
            </>
        );
    }

    return (
        transactions.length > 0 ?
        <Table striped bordered hover >
            <thead>
                <tr>
                    <th>Profit</th>
                    <th>Service date</th>
                    <th>Current status</th>
                </tr>
            </thead>
            <tbody>
                {list(transactions)}
            </tbody>
        </Table>
        :
        <EmptyTransactionListView />
    )
}


function EmptyTransactionListView() {

    const styles = {
        content: {
            background: '#FFF',
            borderRadius: '8px',
            padding: '10px',
            borderColor: Colors.brand,
            border: `1px solid ${Colors.divider}`,
            fontStyle: 'italic'
        },

    }

    return (
        <Container style={styles.content}>
            <p>You don't have any transactions at the moment. When you do, they will be listed here.<br/><br/> Share your <a href="/affiliate">affiliate link</a>. Once someone purchases an oil change using your link, you'll see transactions here</p>
        </Container>
    )
}