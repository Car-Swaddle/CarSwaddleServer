import { Route, Switch } from "react-router-dom";
import AffiliateDashboard from "./AffiliateDashboard";
import AuthenticatedNavigation from "./AuthenticatedNavigation";
import TransactionsPage from "./TransactionsPage";
import { Container, Row, Col } from 'react-bootstrap';


export default function AuthenticatedPage() {
    return (
        <Container>
            <AuthenticatedNavigation/>
            <Switch>
                <Route exact path="/affiliate" component={AffiliateDashboard} />
                <Route path="/transactions" component={TransactionsPage} />
                <Route path="*" component={AffiliateDashboard} />
            </Switch>
        </Container>
    )
}