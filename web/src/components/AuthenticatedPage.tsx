import { Redirect, Route, Switch } from "react-router-dom";
import AffiliateDashboard from "./AffiliateDashboard";
import AuthenticatedNavigation from "./AuthenticatedNavigation";
import TransactionsPage from "./transactions/TransactionsPage";

export enum Tab {
    affiliate = 'affiliate',
    transactions = 'transactions'
}

export default function AuthenticatedPage() {

    return (
        <>
            <AuthenticatedNavigation tab={`/` + window.location.pathname.split('/')[1] ?? ""} />
            <Switch>
                <Route exact path="/affiliate" component={AffiliateDashboard} />
                <Route path="/transactions" component={TransactionsPage} />
                <Redirect from='*' to='/affiliate' />
            </Switch>
        </>
    )
}