import { Navbar, Container, Nav, NavDropdown } from 'react-bootstrap'
import CarSwaddleLogo from './CarSwaddleLogo'


export default function AuthenticatedNavigation() {

    return (
        <Container>
            <Navbar bg="light" expand="sm">
                <Container>
                    <Navbar.Brand href="/affiliate">
                        <CarSwaddleLogo height='50px' />
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav>
                            <Nav.Link href="/affiliate">Affilate</Nav.Link>
                            <Nav.Link href="/transactions">Transactions</Nav.Link>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        </Container>
    )

}